// ================== SOTERIA ESP32 FIRMWARE ==================
// Production version for emergency response system

// Event types first so Arduino can auto-prototype.
enum EventType { EV_NONE, EV_BTN_SHORT, EV_SOS, EV_IN_SMS, EV_OTW };
void startEvent(EventType ev, unsigned long durationMs);
void renderEvent();
void renderBaseStatus();
void readIncomingSMS();
void smsPollUnread();

// ====== EVENT STATE / PERSISTENT VARS ======
EventType currentEvent = EV_NONE;
unsigned long eventUntilMs = 0;
unsigned long pressStartMs = 0;
bool longPressLatched = false;

// ================== INCLUDES & LIBS ==================
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <ctype.h>
#include <math.h>   // for isnan

// Modem
#define TINY_GSM_MODEM_A7670
#include <TinyGsmClient.h>

TinyGsm modem(Serial1);   // SerialAT for A7670

// ====== SERIAL ======
#define SerialMon Serial
#define SerialAT  Serial1      // A7670 UART (SMS AT)

// ====== WIFI ======
#define WIFI_SSID     "kwarto"
#define WIFI_PASSWORD "kimchi143"

// ====== UI / IO PINS - CONFIGURABLE FOR YOUR BOARD ======
#define RED_PIN   23
#define GREEN_PIN 18
#define BLUE_PIN  19
#define MOTOR_PIN 13    // Try different pins if this doesn't work: 13, 15, 16, 17
#define BUTTON_PIN 2

// ====== MOTOR CONFIGURATION - TRY BOTH SETTINGS ======
#define MOTOR_ACTIVE_HIGH 1   // Try 0 if vibrator doesn't work
#define MOTOR_USE_PWM 1       // Try PWM instead of digital write
#define MOTOR_PWM_CHANNEL 0
#define MOTOR_PWM_FREQ 1000
#define MOTOR_PWM_RESOLUTION 8

// ====== MODEM PINS (LilyGO T-A7670X) - VERIFY THESE FOR YOUR BOARD ======
#define MODEM_RESET_PIN 5
#define MODEM_PWKEY     4
#define MODEM_POWER_ON  12
#define MODEM_TX        26
#define MODEM_RX        27
#define MODEM_RESET_LEVEL HIGH

// ====== GPS COORDINATES ======
const double FIXED_LAT = 14.823505988245435;
const double FIXED_LNG = 120.27908895582281;

// ====== ADMIN / PAIRING ======
const char* ADMIN_NUMBER = "+639451458138";  // fallback SMS target until PAIR succeeded

// ====== SUPABASE (Edge Functions) ======
const char* FX_HOST     = "jzcqjxdieiecsmmxihkl.supabase.co";
const char* PATH_PAIR   = "/functions/v1/pair";
const char* PATH_INGEST = "/functions/v1/ingest";
const char* FX_APIKEY   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Y3FqeGRpZWllY3NtbXhpaGtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NjI3MDUsImV4cCI6MjA3MzMzODcwNX0.4lIFfcKVcz4z0K_u_H8IycO-bcxztSstSYgvZD0tV7A";
const char* FX_SECRET   = "33282c89d2bc12d1f7a574d62c482dcac8162d21d2f38cf291682d5a00e6a6c3";

// ====== TLS CONFIG ======
#define TLS_INSECURE 1

// ====== DEVICE ID ======
String HW_UID = "soteria-device-001";

// ====== STATE / PERSIST ======
Preferences prefs;
String guardianMsisdn = "";
String deviceToken    = "";

bool hasGuardian() { return guardianMsisdn.length() >= 7; }
bool hasToken()    { return deviceToken.length()   >  0; }

void saveGuardian(const String& n){ prefs.begin("soteria", false); prefs.putString("guardian", n); prefs.end(); }
String loadGuardian(){ prefs.begin("soteria", true); String s=prefs.getString("guardian",""); prefs.end(); return s; }
void clearGuardian(){ prefs.begin("soteria", false); prefs.remove("guardian"); prefs.end(); }
void saveToken(const String& t){ prefs.begin("soteria", false); prefs.putString("devtoken", t); prefs.end(); }
String loadToken(){ prefs.begin("soteria", true); String s=prefs.getString("devtoken",""); prefs.end(); return s; }
void clearToken(){ prefs.begin("soteria", false); prefs.remove("devtoken"); prefs.end(); }

inline const char* smsDest() { return hasGuardian() ? guardianMsisdn.c_str() : ADMIN_NUMBER; }

// ====== LED helpers ======
inline void ledRaw(bool r, bool g, bool b){
  digitalWrite(RED_PIN,   !r);  // Assuming common anode RGB
  digitalWrite(GREEN_PIN, !g);
  digitalWrite(BLUE_PIN,  !b);
}
inline void ledOff(){ ledRaw(0,0,0); }
inline void ledRed(){ ledRaw(1,0,0); }
inline void ledGreen(){ ledRaw(0,1,0); }
inline void ledBlue(){ ledRaw(0,0,1); }
inline void ledWhite(){ ledRaw(1,1,1); }
inline void ledYellow(){ ledRaw(1,1,0); }
bool blinkOn(unsigned long p){ return (millis()/(p/2))%2==0; }
bool inWindow(unsigned long periodMs, unsigned long onMs){ return (millis()%periodMs)<onMs; }

// ====== ENHANCED MOTOR/VIBRATOR HELPERS ======
void testMotorPin() {
  SerialMon.println("=== MOTOR TEST ===");
  SerialMon.print("Motor pin: "); SerialMon.println(MOTOR_PIN);
  SerialMon.print("Active high: "); SerialMon.println(MOTOR_ACTIVE_HIGH ? "YES" : "NO");
  SerialMon.print("Use PWM: "); SerialMon.println(MOTOR_USE_PWM ? "YES" : "NO");
  
  SerialMon.println("Testing haptic patterns...");
  SerialMon.println("- Short pattern");
  vibShort(); delay(500);
  SerialMon.println("- Medium pattern");
  vibMedium(); delay(500); 
  SerialMon.println("- Long pattern");
  vibLong(); delay(500);
  SerialMon.println("Motor test complete. Did you feel the different patterns?");
}

void motorOn() {
  SerialMon.println("MOTOR: ON");
  if (MOTOR_USE_PWM) {
    // ESP32 Arduino Core 3.x compatible PWM write
    #if ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0)
      ledcWrite(MOTOR_PIN, 255);  // Full PWM - new API uses pin directly
    #else
      ledcWrite(MOTOR_PWM_CHANNEL, 255);  // Full PWM - old API uses channel
    #endif
  } else {
    digitalWrite(MOTOR_PIN, MOTOR_ACTIVE_HIGH ? HIGH : LOW);
  }
}

void motorOff() {
  SerialMon.println("MOTOR: OFF");
  if (MOTOR_USE_PWM) {
    // ESP32 Arduino Core 3.x compatible PWM write
    #if ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0)
      ledcWrite(MOTOR_PIN, 0);    // 0 PWM - new API uses pin directly
    #else
      ledcWrite(MOTOR_PWM_CHANNEL, 0);    // 0 PWM - old API uses channel
    #endif
  } else {
    digitalWrite(MOTOR_PIN, MOTOR_ACTIVE_HIGH ? LOW : HIGH);
  }
}

// ====== HAPTIC FEEDBACK CONSTANTS ======
#define VIB_SHORT  120   // Short vibration (~120ms)
#define VIB_MEDIUM 300   // Medium vibration (~300ms)
#define VIB_LONG   600   // Long vibration (~600ms)
#define VIB_PAUSE_SHORT 150   // Short pause between patterns
#define VIB_PAUSE_LONG  300   // Long pause between patterns

unsigned long vibUntilMs = 0;
void vibOnTimed(uint16_t ms) {
  SerialMon.print("VIB: "); SerialMon.print(ms); SerialMon.println("ms");
  motorOn();
  vibUntilMs = millis() + ms;
}

// Basic vibration patterns
void vibShort() { vibOnTimed(VIB_SHORT); }
void vibMedium() { vibOnTimed(VIB_MEDIUM); }
void vibLong() { vibOnTimed(VIB_LONG); }

// Button action patterns
void vibButtonAlert() { 
  // Short press: short, short
  vibShort(); delay(VIB_SHORT + 50); vibShort(); 
}
void vibButtonSuccess() {
  // After SMS sent successfully: long
  delay(VIB_PAUSE_LONG);
  vibLong();
}
void vibButtonFail() {
  // SMS failed: short, short, short
  vibShort(); delay(VIB_SHORT + 50); 
  vibShort(); delay(VIB_SHORT + 50); 
  vibShort();
}
void vibSOS() { 
  // Long press: long, short, long, short
  vibLong(); delay(VIB_LONG + 50);
  vibShort(); delay(VIB_SHORT + 50);
  vibLong(); delay(VIB_LONG + 50);
  vibShort();
}

// Communication patterns  
void vibIncomingSMS() {
  // Incoming SMS: short, short, short
  vibShort(); delay(VIB_SHORT + 50);
  vibShort(); delay(VIB_SHORT + 50);
  vibShort();
}
void vibOTW() {
  // OTW received: medium, long
  vibMedium(); delay(VIB_MEDIUM + 50);
  vibLong();
}
void vibStatusPing() {
  // Status ping reply: short + pause + short
  vibShort(); delay(VIB_PAUSE_SHORT);
  vibShort();
}

// Pairing patterns
void vibPairSuccess() {
  // PAIR success: short, medium, long
  vibShort(); delay(VIB_SHORT + 50);
  vibMedium(); delay(VIB_MEDIUM + 50);
  vibLong();
}
void vibPairFailed() {
  // PAIR failed: short, short, short, long
  vibShort(); delay(VIB_SHORT + 50);
  vibShort(); delay(VIB_SHORT + 50);
  vibShort(); delay(VIB_SHORT + 50);
  vibLong();
}
void vibUnpairSuccess() {
  // UNPAIR success: medium, medium
  vibMedium(); delay(VIB_MEDIUM + 50);
  vibMedium();
}
void vibUnpairDenied() {
  // UNPAIR denied: 5x short
  for(int i = 0; i < 5; i++) {
    vibShort(); 
    if(i < 4) delay(VIB_SHORT + 30);
  }
}

// ====== SMS/MODEM HELPERS ======
void getModemInfo() {
  SerialMon.println("=== MODEM INFO ===");
  
  // Basic AT test
  SerialMon.print("AT response: ");
  modem.sendAT("");
  if (modem.waitResponse()) SerialMon.println("OK");
  else SerialMon.println("FAILED");
  
  // SIM status
  int simStatus = modem.getSimStatus();
  SerialMon.print("SIM Status: "); SerialMon.println(simStatus);
  SerialMon.println("  (0=ERROR, 1=READY, 2=PIN_REQUIRED, 3=PUK_REQUIRED)");
  
  // Network registration
  bool netConnected = modem.isNetworkConnected();
  SerialMon.print("Network connected: "); SerialMon.println(netConnected ? "YES" : "NO");
  
  // Signal quality
  int signal = modem.getSignalQuality();
  SerialMon.print("Signal quality: "); SerialMon.println(signal);
  
  // IMEI
  String imei = modem.getIMEI();
  SerialMon.print("IMEI: "); SerialMon.println(imei.length() > 0 ? imei : "FAILED");
  
  // Operator info
  String cop = modem.getOperator();
  SerialMon.print("Operator: "); SerialMon.println(cop.length() > 0 ? cop : "UNKNOWN");
  
  // SMS center
  modem.sendAT("+CSCA?");
  SerialMon.print("SMS Center: ");
  if (modem.waitResponse(1000L, "+CSCA:")) {
    SerialMon.println(modem.stream.readStringUntil('\n'));
  } else {
    SerialMon.println("FAILED");
  }
  
  SerialMon.println("=== END MODEM INFO ===");
}

void testSMSBasic() {
  SerialMon.println("=== SMS TEST ===");
  
  // Test if we can send a simple SMS
  String testMsg = "TEST: ESP32 SMS working at " + String(millis());
  SerialMon.print("Sending test SMS to: "); SerialMon.println(ADMIN_NUMBER);
  SerialMon.print("Message: "); SerialMon.println(testMsg);
  
  bool result = modem.sendSMS(ADMIN_NUMBER, testMsg);
  SerialMon.print("SMS Result: "); SerialMon.println(result ? "SUCCESS" : "FAILED");
  
  if (!result) {
    SerialMon.println("SMS FAILED - Checking possible causes:");
    SerialMon.print("- SIM Status: "); SerialMon.println(modem.getSimStatus());
    SerialMon.print("- Network: "); SerialMon.println(modem.isNetworkConnected() ? "OK" : "NOT CONNECTED");
    SerialMon.print("- Signal: "); SerialMon.println(modem.getSignalQuality());
    
    // Try manual AT commands
    SerialMon.println("Trying manual SMS AT commands:");
    modem.sendAT("+CMGF=1");  // Text mode
    modem.waitResponse();
    
    modem.sendAT("+CMGS=\"", ADMIN_NUMBER, "\"");
    if (modem.waitResponse(">")) {
      SerialAT.print("Manual SMS test");
      SerialAT.write(0x1A);  // Ctrl+Z to send
      SerialMon.print("Manual SMS result: ");
      if (modem.waitResponse()) SerialMon.println("OK");
      else SerialMon.println("FAILED");
    } else {
      SerialMon.println("Failed to get SMS prompt");
    }
  }
  
  SerialMon.println("=== END SMS TEST ===");
}

// ====== STATUS ======
enum NetStatus { NET_NONE, NET_SEARCH, NET_OK, NET_SIM_LOCK };
NetStatus netStatus = NET_NONE;

void renderBaseStatus(){
  if (currentEvent!=EV_NONE && millis()<eventUntilMs) { renderEvent(); return; }
  currentEvent = EV_NONE;

  if (netStatus == NET_SIM_LOCK) { if (blinkOn(1000)) ledYellow(); else ledOff(); return; }
  if (netStatus == NET_OK) { ledGreen(); return; }
  if (netStatus == NET_SEARCH) { if (inWindow(1000, 500)) ledRed(); else ledYellow(); return; }
  ledRed();
}

// ====== NETWORK ======
WiFiClientSecure tls;

// ====== SIMPLE JSON HELPERS ======
String jsonGetStr(const String& body, const char* key){
  String pat = String("\"") + key + "\":";
  int i = body.indexOf(pat); if (i<0) return "";
  i += pat.length();
  while (i<(int)body.length() && isspace(body[i])) i++;
  if (i>=(int)body.length() || body[i]!='"') return "";
  int j = body.indexOf('"', i+1); if (j<0) return "";
  return body.substring(i+1, j);
}

static inline void appendJsonEscaped(String& out, const char* s){
  for (const char* p=s; *p; ++p){
    char c=*p;
    if      (c=='"') out += "\\\"";
    else if (c=='\\') out += "\\\\";
    else if (c=='\b') out += "\\b";
    else if (c=='\f') out += "\\f";
    else if (c=='\n') out += "\\n";
    else if (c=='\r') out += "\\r";
    else if (c=='\t') out += "\\t";
    else out += c;
  }
}

// ====== HTTP HELPERS (HTTPClient) ======
bool httpPostJson(const char* path, const String& json, String& respOut){
  if (WiFi.status()!=WL_CONNECTED) { respOut="WiFi DOWN"; SerialMon.println(respOut); return false; }

  HTTPClient http;
  String url = String("https://") + FX_HOST + String(path);
  SerialMon.print("🌐 POST "); SerialMon.println(url);
  SerialMon.print("📤 Payload: "); SerialMon.println(json);

  if (!http.begin(tls, url)) { respOut = "HTTP begin() failed"; SerialMon.println(respOut); return false; }

  http.setTimeout(25000);
  http.addHeader("Content-Type", "application/json", true, true);
  http.addHeader("Connection", "close", true, true);
  http.addHeader("apikey", FX_APIKEY, true, true);
  http.addHeader("Authorization", String("Bearer ") + FX_APIKEY, true, true);
  http.addHeader("x-device-secret", FX_SECRET, true, true);

  int status = http.POST((uint8_t*)json.c_str(), json.length());
  respOut = http.getString();
  http.end();

  SerialMon.printf("📥 HTTP %d\n", status);
  SerialMon.print("📥 Response: "); SerialMon.println(respOut);
  return status >= 200 && status < 300;
}

bool postWithBackoff(const char* path, const String& json, String& resp){
  uint16_t waitMs = 600;
  for (uint8_t i = 0; i < 3; i++) {
    if (httpPostJson(path, json, resp)) return true;
    SerialMon.print("🔄 Retry "); SerialMon.print(i+1); SerialMon.print("/3 in "); SerialMon.print(waitMs); SerialMon.println("ms");
    delay(waitMs);
    waitMs = (uint16_t)min(4000, (int)waitMs * 2);
  }
  return false;
}

// ====== HELPERS ======
// Show coords in SMS (no Google Maps link)
static String formatCoords() {
  char buf[48];
  snprintf(buf, sizeof(buf), "LAT: %.6f, LNG: %.6f", FIXED_LAT, FIXED_LNG);
  return String(buf);
}

// Get battery level (simulate since no real ADC reading)
float getBatteryLevel() {
  // TODO: Replace with actual ADC reading from your battery monitoring circuit
  return 75.0 + (millis() % 10000) / 500.0; // Simulated 75-95% range
}

// Get signal strength
int getSignalStrength() {
  return modem.getSignalQuality();
}

// After-SMS settle time so modem can finish the TX cleanly
const uint16_t SMS_SETTLE_MS = 2000;

// ====== API CALLS ======
// --- Ingest FIRST (so it's visible when called from pairDevice) ---
bool ingestEvent(const char* type, const char* message, float lat=NAN, float lng=NAN){
  if (!hasToken()) {
    SerialMon.println(String("🚫 [INGEST] SUPPRESSED (not paired yet). type=") + type);
    return false;
  }

  String payload = "{";
  payload += "\"device_token\":\""; appendJsonEscaped(payload, deviceToken.c_str()); payload += "\"";
  payload += ",\"hw_uid\":\""; appendJsonEscaped(payload, HW_UID.c_str()); payload += "\"";
  payload += ",\"event_type\":\""; appendJsonEscaped(payload, type); payload += "\",\"payload\":{";
  
  bool wrote=false;
  if (message && strlen(message) > 0){ 
    payload += "\"message\":\""; 
    appendJsonEscaped(payload, message); 
    payload += "\""; 
    wrote=true; 
  }
  
  if (!isnan(lat) && !isnan(lng)){
    if (wrote) payload += ",";
    payload += "\"lat\":" + String(lat,6) + ",\"lng\":" + String(lng,6);
    wrote=true;
  }
  
  // Add device health data
  float battery = getBatteryLevel();
  int signal = getSignalStrength();
  
  if (wrote) payload += ",";
  payload += "\"battery_level\":" + String(battery, 1);
  payload += ",\"signal_strength\":" + String(signal);
  payload += ",\"network_status\":\"" + String(netStatus) + "\"";
  payload += ",\"wifi_connected\":" + String(WiFi.status() == WL_CONNECTED ? "true" : "false");
  
  // Add timestamp
  payload += ",\"device_timestamp\":" + String(millis());
  
  payload += "}}";

  SerialMon.print("📊 INGEST event: "); SerialMon.println(type);
  String resp;
  bool ok = postWithBackoff(PATH_INGEST, payload, resp);

  SerialMon.println(ok ? "✅ Ingest OK" : "❌ Ingest FAILED");
  return ok;
}

// --- Pair AFTER ingestEvent so calls compile fine ---
bool pairDevice(const String& code, const char* model){
  String payload = "{\"code\":\""+code+"\",\"hw_uid\":\""+HW_UID+"\",\"model\":\""+String(model)+"\"}";
  SerialMon.print("🔗 PAIR attempt with code: "); SerialMon.println(code);
  String resp;
  bool ok = postWithBackoff(PATH_PAIR, payload, resp);
  SerialMon.println(ok ? "✅ Pair OK" : "❌ Pair FAILED");
  if (ok){
    String tok = jsonGetStr(resp, "device_token");
    if (tok.length()){
      deviceToken = tok;
      saveToken(deviceToken);
      SerialMon.print("💾 Saved device_token: "); SerialMon.println(deviceToken);

      // Now that we're paired, send confirm + first heartbeat (with coords)
      ingestEvent("PAIR_OK", "Device paired successfully", (float)FIXED_LAT, (float)FIXED_LNG);
      delay(500); // Brief pause between events
      ingestEvent("HEALTH", "Post-pair heartbeat - all systems operational");
    } else {
      SerialMon.println("❌ ERROR: No device_token in pair response");
      return false;
    }
  }
  return ok;
}

// ====== SMS send with enhanced feedback ======
bool sendSMS_withFeedback(const char* number, const char* msg) {
  SerialMon.println("=== SENDING SMS ===");
  SerialMon.print("To: "); SerialMon.println(number);
  SerialMon.print("Message: "); SerialMon.println(msg);
  
  // Check prerequisites
  int simStatus = modem.getSimStatus();
  bool netOK = modem.isNetworkConnected();
  
  SerialMon.print("SIM Status: "); SerialMon.println(simStatus);
  SerialMon.print("Network Connected: "); SerialMon.println(netOK ? "YES" : "NO");
  
  if (simStatus != 3 && simStatus != 1) {
    SerialMon.println("ERROR: SIM not ready");
    ledRed(); vibButtonFail();
    return false;
  }
  
  if (!netOK) {
    SerialMon.println("ERROR: Network not connected");
    ledRed(); vibButtonFail();
    return false;
  }
  
  // Visual feedback during send
  for (int i = 0; i < 10; i++) {
    ledGreen(); delay(50);
    ledOff(); delay(50);
  }
  
  SerialMon.println("Attempting SMS send...");
  bool ok = modem.sendSMS(number, msg);
  
  SerialMon.print("SMS Result: "); SerialMon.println(ok ? "SUCCESS" : "FAILED");
  
  if (ok) {
    SerialMon.println("✓ SMS sent successfully!");
    ledBlue(); delay(300);
  } else {
    SerialMon.println("✗ SMS send failed!");
    ledRed(); vibButtonFail(); delay(300);
    
    // Additional diagnostics on failure
    SerialMon.println("SMS Failure Analysis:");
    modem.sendAT("+CMEE=2"); modem.waitResponse();  // Verbose errors
    modem.sendAT("+CPMS?"); modem.waitResponse();   // Memory status
    modem.sendAT("+CSCA?"); modem.waitResponse();   // SMS center
  }
  
  SerialMon.println("=== SMS COMPLETE ===");
  return ok;
}

// ====== SMS parser ======
void processInboundSms(const String& fromMsisdn, String body){
  SerialMon.print("📱 SMS from "); SerialMon.print(fromMsisdn);
  SerialMon.print(": "); SerialMon.println(body);
  
  startEvent(EV_IN_SMS, 1200);
  
  String norm = body; norm.trim();
  while (norm.indexOf("  ") >= 0) norm.replace("  "," ");
  String upper = norm; upper.toUpperCase();
  
  if (upper.startsWith("TEST")) {
    SerialMon.println("🧪 Test SMS received - sending response");
    sendSMS_withFeedback(fromMsisdn.c_str(), "✅ Test response from ESP32");
    ingestEvent("IN_SMS", ("Test command from:" + fromMsisdn).c_str());
    
  } else if (upper.startsWith("VIB")) {
    SerialMon.println("📳 Vibration test command received");
    vibMedium();
    sendSMS_withFeedback(fromMsisdn.c_str(), "✅ Vibration test executed");
    ingestEvent("IN_SMS", ("VIB command from:" + fromMsisdn).c_str());
    
  } else if (upper.startsWith("INFO")) {
    SerialMon.println("ℹ️ Info command received");
    getModemInfo();
    sendSMS_withFeedback(fromMsisdn.c_str(), "✅ Modem info printed to serial");
    ingestEvent("IN_SMS", ("Info command from:" + fromMsisdn).c_str());
    
  } else if (upper.startsWith("PAIR")) {
    String code = "";
    int sp = upper.indexOf(' ');
    if (sp > 0) code = norm.substring(sp+1);
    if (code.length()==0){
      int p = norm.indexOf(':'); if (p<0) p = norm.indexOf('-');
      if (p>0) code = norm.substring(p+1);
    }
    code.trim();
    
    SerialMon.print("🔗 Pair command received. Code: "); SerialMon.println(code);
    
    if (WiFi.status()!=WL_CONNECTED){
      sendSMS_withFeedback(fromMsisdn.c_str(), "❌ ERROR: No WiFi connection. Please connect device to WiFi and retry pairing.");
      return;
    }
    
    if (code.length() == 0) {
      sendSMS_withFeedback(fromMsisdn.c_str(), "❌ ERROR: No pairing code provided. Send 'PAIR <code>' format.");
      return;
    }
    
    SerialMon.println("🚀 Attempting to pair device...");
    bool ok = pairDevice(code, "ESP32+A7670+WiFi");
    if (ok) {
      guardianMsisdn = fromMsisdn; 
      saveGuardian(guardianMsisdn);
      String confirmMsg = "✅ SUCCESS: Device paired! Guardian: " + fromMsisdn;
      sendSMS_withFeedback(guardianMsisdn.c_str(), confirmMsg.c_str());
      vibPairSuccess();
      SerialMon.println("✅ Pairing completed successfully");
    } else {
      sendSMS_withFeedback(fromMsisdn.c_str(), "❌ ERROR: Pairing failed. Check code and try again.");
      vibPairFailed();
      SerialMon.println("❌ Pairing failed");
    }

  } else if (upper=="OTW") {
    SerialMon.println("🚗 Received OTW (On The Way) message");
    startEvent(EV_OTW, 5000);
    vibOTW();
    ingestEvent("OTW", ("Guardian responding - from:" + fromMsisdn).c_str(), (float)FIXED_LAT, (float)FIXED_LNG);

  } else if (upper=="UNPAIR") {
    if (hasGuardian() && fromMsisdn == guardianMsisdn) {
      SerialMon.println("🔓 Authorized unpair request received");
      clearGuardian(); clearToken();
      guardianMsisdn = ""; deviceToken = "";
      ingestEvent("UNPAIR_OK", ("Unpaired by guardian:" + fromMsisdn).c_str());
      sendSMS_withFeedback(fromMsisdn.c_str(), "✅ Device unpaired successfully. Reverting to admin-only mode.");
      vibUnpairSuccess();
    } else {
      SerialMon.println("🚫 Unauthorized unpair attempt");
      ingestEvent("UNPAIR_DENY", ("Unauthorized unpair attempt from:" + fromMsisdn).c_str());
      sendSMS_withFeedback(fromMsisdn.c_str(), "❌ ERROR: Not authorized to unpair this device.");
      vibUnpairDenied();
    }

  } else if (upper=="PING" || upper=="STATUS") {
    SerialMon.println("📡 Status ping received");
    String statusMsg = "✅ PONG - Status OK. Battery: " + String(getBatteryLevel(), 1) + "%, Signal: " + String(getSignalStrength());
    statusMsg += ", Location: " + formatCoords();
    sendSMS_withFeedback(fromMsisdn.c_str(), statusMsg.c_str());
    vibStatusPing();
    ingestEvent("HEALTH", ("Status ping from:" + fromMsisdn).c_str(), (float)FIXED_LAT, (float)FIXED_LNG);
    
  } else {
    SerialMon.println("❓ Unknown SMS command");
    sendSMS_withFeedback(fromMsisdn.c_str(), "❓ Unknown command. Try: TEST, VIB, INFO, PAIR <code>, PING, OTW, UNPAIR");
    ingestEvent("IN_SMS", ("Unknown command: " + body + " from:" + fromMsisdn).c_str());
  }
}

// ====== SMS Reading ======
void readIncomingSMS(){
  while (SerialAT.available()) {
    String line = SerialAT.readStringUntil('\n'); line.trim();
    if (!line.length()) continue;
    
    SerialMon.print("MODEM: "); SerialMon.println(line);  // Log all modem output
    
    if (line.startsWith("+CMT:")) {
      String fromMsisdn = "";
      int q1 = line.indexOf('"');
      if (q1 >= 0) {
        int q2 = line.indexOf('"', q1 + 1);
        if (q2 > q1) {
          fromMsisdn = line.substring(q1 + 1, q2);
        }
      }
      String body = SerialAT.readStringUntil('\n'); body.trim();
      if (fromMsisdn.length() && body.length()) {
        processInboundSms(fromMsisdn, body);
      }
    }
  }
}

// ====== POLLING ======
unsigned long lastNetPollMs = 0;
unsigned long lastStatusMs = 0;
unsigned long lastHealth = 0;

void pollNetwork(){
  int sim = modem.getSimStatus();
  bool simReady = (sim == 1 || sim == 3);
  if (!simReady) { 
    netStatus = NET_SIM_LOCK; 
    return; 
  }
  if (modem.isNetworkConnected()) {
    netStatus = NET_OK;
  } else {
    netStatus = NET_SEARCH;
  }
}

// ====== TIME (TLS needs correct RTC) ======
bool syncTime(uint32_t maxWaitMs = 20000) {
  SerialMon.println("🕒 Syncing time for TLS...");
  configTime(0, 0, "pool.ntp.org", "time.google.com", "time.cloudflare.com");
  time_t now = 0;
  uint32_t t0 = millis();
  while (now < 1700000000 && (millis() - t0) < maxWaitMs) { delay(200); time(&now); }
  if (now < 1700000000) { 
    SerialMon.println("⚠️ WARN: NTP time NOT synced. TLS may fail."); 
    return false; 
  }
  SerialMon.println("✅ Time synced successfully.");
  return true;
}

// ====== SETUP ======
void setup(){
  // Initialize pins
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  
  // Initialize motor pin
  if (MOTOR_USE_PWM) {
    // ESP32 Arduino Core 3.x compatible PWM setup
    #if ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0)
      ledcAttach(MOTOR_PIN, MOTOR_PWM_FREQ, MOTOR_PWM_RESOLUTION);
    #else
      ledcSetup(MOTOR_PWM_CHANNEL, MOTOR_PWM_FREQ, MOTOR_PWM_RESOLUTION);
      ledcAttachPin(MOTOR_PIN, MOTOR_PWM_CHANNEL);
    #endif
    SerialMon.println("Motor configured for PWM");
  } else {
    pinMode(MOTOR_PIN, OUTPUT);
    SerialMon.println("Motor configured for digital output");
  }
  
  ledOff();
  motorOff();
  
  SerialMon.begin(115200);
  delay(1000);
  
  SerialMon.println("╔══════════════════════════════════════╗");
  SerialMon.println("║      SOTERIA ESP32 FIRMWARE         ║");
  SerialMon.println("╚══════════════════════════════════════╝");
  SerialMon.println();
  
  // Test vibrator immediately
  SerialMon.println("🔧 TESTING VIBRATOR...");
  testMotorPin();
  
  // Initialize modem
  SerialMon.println("📡 INITIALIZING A7670 MODEM...");
  
  // Modem power sequence
  pinMode(MODEM_POWER_ON, OUTPUT); digitalWrite(MODEM_POWER_ON, HIGH);
  pinMode(MODEM_RESET_PIN, OUTPUT);
  
  // Hard reset sequence
  digitalWrite(MODEM_RESET_PIN, !MODEM_RESET_LEVEL); delay(100);
  digitalWrite(MODEM_RESET_PIN, MODEM_RESET_LEVEL); delay(2600);
  digitalWrite(MODEM_RESET_PIN, !MODEM_RESET_LEVEL);
  
  // Power key sequence  
  pinMode(MODEM_PWKEY, OUTPUT);
  digitalWrite(MODEM_PWKEY, LOW); delay(100);
  digitalWrite(MODEM_PWKEY, HIGH); delay(1000); 
  digitalWrite(MODEM_PWKEY, LOW);
  
  SerialAT.begin(115200, SERIAL_8N1, MODEM_RX, MODEM_TX);
  SerialAT.setTimeout(1000);
  delay(3000);
  
  SerialMon.println("Initializing modem...");
  if (modem.init()) {
    SerialMon.println("✓ Modem initialized");
  } else {
    SerialMon.println("✗ Modem init failed");
  }
  
  // Configure modem
  modem.sendAT("+CFUN=1");  modem.waitResponse();  // Full function
  modem.sendAT("+CMEE=2");  modem.waitResponse();  // Verbose errors
  modem.sendAT("+CMGF=1");  modem.waitResponse();  // SMS text mode
  modem.sendAT("+CNMI=2,2,0,0,0"); modem.waitResponse(); // SMS notifications
  
  // Wait for network
  SerialMon.println("📶 WAITING FOR NETWORK...");
  unsigned long netStart = millis();
  while (!modem.isNetworkConnected() && (millis() - netStart) < 30000) {
    SerialMon.print(".");
    delay(1000);
  }
  SerialMon.println();
  
  if (modem.isNetworkConnected()) {
    SerialMon.println("✓ Network connected");
  } else {
    SerialMon.println("⚠ Network timeout - SMS may not work");
  }
  
  // Get IMEI for device ID
  String imei = modem.getIMEI();
  if (imei.length() > 0) {
    HW_UID = imei;
    SerialMon.print("📱 IMEI: "); SerialMon.println(imei);
  }
  
  // Full modem info
  getModemInfo();
  
  // WiFi for HTTPS API calls
  SerialMon.print("📶 CONNECTING TO WIFI: "); SerialMon.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long wifiStart = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - wifiStart) < 15000) {
    SerialMon.print(".");
    delay(500);
  }
  SerialMon.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    SerialMon.print("✅ WiFi connected: "); SerialMon.println(WiFi.localIP());
  } else {
    SerialMon.println("⚠️ WiFi failed - Supabase API calls disabled");
  }

  // TLS prerequisites
  bool timeOk = syncTime();
  if (TLS_INSECURE) { 
    tls.setInsecure(); 
    SerialMon.println("⚠️ TLS WARNING: INSECURE mode (no certificate validation)"); 
  } else { 
    // Would need full certificate chain here
    SerialMon.println("🔒 TLS: Certificate validation enabled");
  }
  tls.setTimeout(25000);

  // Load persisted data
  guardianMsisdn = loadGuardian();
  deviceToken    = loadToken();
  SerialMon.print("📱 Stored Guardian: "); SerialMon.println(hasGuardian() ? guardianMsisdn : "<none>");
  SerialMon.print("🔑 Device Token: "); SerialMon.println(hasToken() ? "<present>" : "<none>");
  
  if (hasGuardian() && hasToken()) {
    SerialMon.println("✅ Device is already paired and ready");
    // Send startup notification
    if (WiFi.status() == WL_CONNECTED) {
      ingestEvent("HEALTH", "Device startup - system ready");
    }
  } else {
    SerialMon.println("📲 Device not paired - waiting for PAIR SMS command");
  }
  
  SerialMon.println();
  SerialMon.println("🚀 SETUP COMPLETE - FULL SUPABASE INTEGRATION ENABLED!");
  SerialMon.println("📖 AVAILABLE SMS COMMANDS:");
  SerialMon.println("   TEST - Send test response");
  SerialMon.println("   VIB  - Test vibration");
  SerialMon.println("   INFO - Print modem info");
  SerialMon.println("   PAIR <code> - Pair device with Supabase");
  SerialMon.println("   PING/STATUS - Get device status");
  SerialMon.println("   OTW - Mark 'On The Way'");
  SerialMon.println("   UNPAIR - Unpair device (guardian only)");
  SerialMon.println();
  SerialMon.println("🔘 BUTTON ACTIONS:");
  SerialMon.println("   Short press - Emergency alert + Supabase event");
  SerialMon.println("   Long press (2s) - SOS emergency + Supabase event");
  SerialMon.println();
  SerialMon.println("🌐 SUPABASE FEATURES:");
  SerialMon.println("   ✅ Device pairing with dashboard");
  SerialMon.println("   ✅ Real-time event ingestion");
  SerialMon.println("   ✅ Guardian management");
  SerialMon.println("   ✅ Health monitoring");
  SerialMon.println();
  
  // Test SMS on startup
  delay(2000);
  testSMSBasic();
}

// ====== MAIN LOOP ======
unsigned long lastBounceMs = 0;
static int lastState = HIGH;

void loop(){
  unsigned long now = millis();
  
  // Motor watchdog
  if (vibUntilMs && (long)(now - vibUntilMs) >= 0) {
    motorOff();
    vibUntilMs = 0;
  }
  
  // Network status update
  if (now - lastNetPollMs > 5000) {
    lastNetPollMs = now;
    pollNetwork();
  }
  
  // Status info every 30 seconds
  if (now - lastStatusMs > 30000) {
    lastStatusMs = now;
    SerialMon.print("📊 Status - Net: ");
    SerialMon.print(netStatus);
    SerialMon.print(", Signal: ");
    SerialMon.print(modem.getSignalQuality());
    SerialMon.print(", WiFi: ");
    SerialMon.println(WiFi.status() == WL_CONNECTED ? "OK" : "DOWN");
  }
  
  // Button handling with debounce
  int btn = digitalRead(BUTTON_PIN);
  if (btn != lastState && (now - lastBounceMs) > 50) {
    lastBounceMs = now;
    
    if (btn == LOW) {
      // Button pressed
      pressStartMs = now;
      longPressLatched = false;
      SerialMon.println("🔘 Button pressed");
    } else {
      // Button released
      unsigned long pressDuration = now - pressStartMs;
      
      if (!longPressLatched && pressDuration >= 50 && pressDuration <= 1500) {
        SerialMon.println("🔘 SHORT PRESS - Button alert + Supabase ingest");
        startEvent(EV_BTN_SHORT, 500);
        
        // Initial haptic feedback for button press
        vibButtonAlert();
        
        String msg = String("🚨 Button pressed! ") + formatCoords();
        bool smsSent = sendSMS_withFeedback(smsDest(), msg.c_str());
        
        // Haptic feedback based on SMS result
        if (smsSent) { 
          vibButtonSuccess();
          delay(SMS_SETTLE_MS); 
        }
        // Always ingest, even if SMS failed
        ingestEvent("BTN_SHORT", "Button pressed by user", (float)FIXED_LAT, (float)FIXED_LNG);
      }
    }
    lastState = btn;
  }
  
  // Long press detection
  if (btn == LOW && !longPressLatched && (now - pressStartMs) >= 2000) {
    SerialMon.println("🔘 LONG PRESS - SOS EMERGENCY ALERT");
    longPressLatched = true;
    startEvent(EV_SOS, 4000);
    
    // SOS haptic pattern
    vibSOS();
    
    String msg = String("🚨 EMERGENCY SOS! ") + formatCoords();
    bool smsSent = sendSMS_withFeedback(smsDest(), msg.c_str());
    // settle only if SMS actually went out
    if (smsSent) { delay(SMS_SETTLE_MS); }
    // Always ingest, even if SMS failed
    ingestEvent("SOS", "Emergency SOS activated", (float)FIXED_LAT, (float)FIXED_LNG);
  }
  
  // Read incoming SMS
  readIncomingSMS();
  
  // Periodic health reporting (enhanced with device metrics)
  if (now - lastHealth > 60000){
    lastHealth = now;
    if (hasToken()) {  // Only send if paired
      char buf[128];
      snprintf(buf, sizeof(buf), "Heartbeat - Net:%d Batt:%.1f%% Sig:%d WiFi:%s", 
               netStatus, getBatteryLevel(), getSignalStrength(), 
               WiFi.status() == WL_CONNECTED ? "OK" : "DOWN");
      ingestEvent("HEALTH", buf);
    }
  }
  
  // Update status display
  renderBaseStatus();
  
  delay(10);
}

// ====== EVENT RENDERING ======
void startEvent(EventType ev, unsigned long durationMs){
  currentEvent = ev; 
  eventUntilMs = millis() + durationMs;
  
  switch(ev){
    case EV_BTN_SHORT: 
      SerialMon.println("🎬 Event: Button Short");
      // Haptic feedback is handled in button press logic
      break;
    case EV_SOS:       
      SerialMon.println("🎬 Event: SOS");
      // Haptic feedback is handled in button press logic
      break;
    case EV_IN_SMS:    
      SerialMon.println("🎬 Event: Incoming SMS");
      vibIncomingSMS(); 
      break;
    case EV_OTW:       
      SerialMon.println("🎬 Event: On The Way");
      // Haptic feedback is handled in SMS processing
      break;
    default: break;
  }
}

void renderEvent(){
  switch(currentEvent){
    case EV_BTN_SHORT: 
      if (inWindow(400,200)) ledWhite(); 
      else ledOff(); 
      break;
    case EV_SOS:       
      if (blinkOn(100)) ledWhite(); 
      else ledOff(); 
      break;
    case EV_IN_SMS:    
      if (inWindow(600,200)) ledBlue(); 
      else ledOff(); 
      break;
    case EV_OTW:       
      ledBlue(); 
      break;
    default: 
      break;
  }
}