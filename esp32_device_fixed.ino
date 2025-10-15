// ================== WiFi HTTPS + SMS (HYBRID, POLARITY-SAFE, NO GNSS) ==================
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
#define WIFI_SSID     "Gomma"
#define WIFI_PASSWORD "0123456789"

// ====== UI / IO PINS ======
#define RED_PIN   32
#define GREEN_PIN 25
#define BLUE_PIN  33
#define MOTOR_PIN 13
#define BUTTON_PIN 2

// === Motor polarity (IMPORTANT) ===
#define MOTOR_ACTIVE_HIGH 1   // set 0 if your driver is active-LOW

// ====== MODEM PINS (LilyGO T-A7670X) ======
#define MODEM_RESET_PIN 5
#define MODEM_PWKEY     4
#define MODEM_POWER_ON  12
#define MODEM_TX        26
#define MODEM_RX        27
#define MODEM_RESET_LEVEL HIGH

const double FIXED_LAT = 14.823505988245435;
const double FIXED_LNG = 120.27908895582281;

// ====== ADMIN / PAIRING ======
const char* ADMIN_NUMBER = "+639451458138";  // fallback SMS target until PAIR succeeded

// ====== SUPABASE (Edge Functions) ======
const char* FX_HOST     = "jzcqjxdieiecsmmxihkl.supabase.co"; // no https://
const char* PATH_PAIR   = "/functions/v1/pair";
const char* PATH_INGEST = "/functions/v1/ingest";

// NOTE: ANON key ONLY (never service role)
const char* FX_APIKEY   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Y3FqeGRpZWllY3NtbXhpaGtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NjI3MDUsImV4cCI6MjA3MzMzODcwNX0.4lIFfcKVcz4z0K_u_H8IycO-bcxztSstSYgvZD0tV7A";
const char* FX_SECRET   = "33282c89d2bc12d1f7a574d62c482dcac8162d21d2f38cf291682d5a00e6a6c3"; // must equal DEVICE_INGEST_SECRET env

// ====== TLS mode ======
#define TLS_INSECURE 1
static const char SUPABASE_CA_PEM[] PROGMEM = R"PEM(
-----BEGIN CERTIFICATE-----
MIIDpjCCA0ugAwIBAgIRAMpPdHj8++eRE1GI9D2emCYwCgYIKoZIzj0EAwIwOzEL
MAkGA1UEBhMCVVMxHjAcBgNVBAoTFUdvb2dsZSBUcnVzdCBTZXJ2aWNlczEMMAoG
A1UEAxMDV0UxMB4XDTI1MDkwNjA1MTk0MFoXDTI1MTIwNTA2MTkxNVowFjEUMBIG
A1UEAxMLc3VwYWJhc2UuY28wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQ9D8HX
K0SwrNC46kUv2SpjZ2khZb2jXzZ9osuAONFjvN3ah/b4ipBg7Z+/SbvYyXne9G37
JyFygLYQrPrBPhQFo4ICUzCCAk8wDgYDVR0PAQH/BAQDAgeAMBMGA1UdJQQMMAoG
CCsGAQUFBwMBMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFL00HnhqwbdrXii5zKMU
8gD6kJ2qMB8GA1UdIwQYMBaAFJB3kjVnxP+ozKnme9mAeXvMk/k4MF4GCCsGAQUF
BwEBBFIwUDAnBggrBgEFBQcwAYYbaHR0cDovL28ucGtpLmdvb2cvcy93ZTEveWs4
MCUGCCsGAQUFBzAChhlodHRwOi8vaS5wa2kuZ29vZy93ZTEuY3J0MCUGA1UdEQQe
MByCC3N1cGFiYXNlLmNvgg0qLnN1cGFiYXNlLmNvMBMGA1UdIAQMMAowCAYGZ4EM
AQIBMDYGA1UdHwQvMC0wK6ApoCeGJWh0dHA6Ly9jLnBraS5nb29nL3dlMS9RZndE
aGM5ZE5LWS5jcmwwggEEBgorBgEEAdZ5AgQCBIH1BIHyAPAAdgAS8U40vVNyTIQG
GcOPP3oT+Oe1YoeInG0wBYTr5YYmOgAAAZkdrjcmAAAEAwBHMEUCIQDl9wrgLcIR
Lxg1JPppFeCXGFxFdd+TSo00/PhkO80y/AIgcVkeXomS0oDLQkcSFfjuuvgjzGW8
YEgWfZCFHb2bqo4AdgAN4fIwK9MNwUBiEgnqVS78R3R8sdfpMO8OQh60fk6qNAAA
AZkdrjscAAAEAwBHMEUCICYYVwpJIYEYSAbbK9VtG1syPRJSNcPjfKKm2ymmC+v4
AiEAjlvagtFAPANCcP0PbI28pPfNhaPvWg04SLYFbOzd7x8wCgYIKoZIzj0EAwID
SQAwRgIhAJ9sDm/aKMehJY5UTU4wtJCVMN2wVQP0hcWGqINxoIxiAiEAy7RTVpFE
hOtbxWy10EkLZekoiVnP+rvpLLyfPDhs8O8=
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIICnzCCAiWgAwIBAgIQf/MZd5csIkp2FV0TttaF4zAKBggqhkjOPQQDAzBHMQsw
CQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZpY2VzIExMQzEU
MBIGA1UEAxMLR1RTIFJvb3QgUjQwHhcNMjMxMjEzMDkwMDAwWhcNMjkwMjIwMTQw
MDAwWjA7MQswCQYDVQQGEwJVUzEeMBwGA1UEChMVR29vZ2xlIFRydXN0IFNlcnZp
Y2VzMQwwCgYDVQQDEwNXRTEwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARvzTr+
Z1dHTCEDhUDCR127WEcPQMFcF4XGGTfn1XzthkubgdnXGhOlCgP4mMTG6J7/EFmP
LCaY9eYmJbsPAvpWo4H+MIH7MA4GA1UdDwEB/wQEAwIBhjAdBgNVHSUEFjAUBggr
BgEFBQcDAQYIKwYBBQUHAwIwEgYDVR0TAQH/BAgwBgEB/wIBADAdBgNVHQ4EFgQU
kHeSNWfE/6jMqeZ72YB5e8yT+TgwHwYDVR0jBBgwFoAUgEzW63T/STaj1dj8tT7F
avCUHYwwNAYIKwYBBQUHAQEEKDAmMCQGCCsGAQUFBzAChhhodHRwOi8vaS5wa2ku
Z29vZy9yNC5jcnQwKwYDVR0fBCQwIjAgoB6gHIYaaHR0cDovL2MucGtpLmdvb2cv
ci9yNC5jcmwwEwYDVR0gBAwwCjAIBgZngQwBAgEwCgYIKoZIzj0EAwMDaAAwZQIx
AOcCq1HW90OVznX+0RGU1cxAQXomvtgM8zItPZCuFQ8jSBJSjz5keROv9aYsAm5V
sQIwJonMaAFi54mrfhfoFNZEfuNMSQ6/bIBiNLiyoX46FohQvKeIoJ99cx7sUkFN
7uJW
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIDejCCAmKgAwIBAgIQf+UwvzMTQ77dghYQST2KGzANBgkqhkiG9w0BAQsFADBX
MQswCQYDVQQGEwJCRTEZMBcGA1UEChMQR2xvYmFsU2lnbiBudi1zYTEQMA4GA1UE
CxMHUm9vdCBDQTEbMBkGA1UEAxMSR2xvYmFsU2lnbiBSb290IENBMB4XDTIzMTEx
NTAzNDMyMVoXDTI4MDEyODAwMDA0MlowRzELMAkGA1UEBhMCVVMxIjAgBgNVBAoT
GUdvb2dsZSBUcnVzdCBTZXJ2aWNlcyBMTEMxFDASBgNVBAMTC0dUUyBSb290IFI0
MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAE83Rzp2iLYK5DuDXFgTB7S0md+8Fhzube
Rr1r1WEYNa5A3XP3iZEwWus87oV8okB2O6nGuEfYKueSkWpz6bFyOZ8pn6KY019e
WIZlD6GEZQbR3IvJx3PIjGov5cSr0R2Ko4H/MIH8MA4GA1UdDwEB/wQEAwIBhjAd
BgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwDwYDVR0TAQH/BAUwAwEB/zAd
BgNVHQ4EFgQUgEzW63T/STaj1dj8tT7FavCUHYwwHwYDVR0jBBgwFoAUYHtmGkUN
l8qJUC99BM00qP/8/UswNgYIKoZIzj0EAwEEKjAoMCYGCCsGAQUFBzAChhpodHRw
Oi8vaS5wa2kuZ29vZy9nc3IxLmNydDAtBgNVHR8EJjAkMCKgIKAehhxodHRwOi8v
Yy5wa2kuZ29vZy9yL2dzcjEuY3JsMBMGA1UdIAQMMAowCAYGZ4EMAQIBMA0GCSqG
SIb3DQEBCwUAA4IBAQAYQrsPBtYDh5bjP2OBDwmkoWhIDDkic574y04tfzHpn+cJ
odI2D4SseesQ6bDrarZ7C30ddLibZatoKiws3UL9xnELz4ct92vID24FfVbiI1hY
+SW6FoVHkNeWIP0GCbaM4C6uVdF5dTUsMVs/ZbzNnIdCp5Gxmx5ejvEau8otR/Cs
kGN+hr/W5GvT1tMBjgWKZ1i4//emhA1JG1BbPzoLJQvyEotc03lXjTaCzv8mEbep
8RqZ7a2CPsgRbuvTPBwcOMBBmuFeU88+FSBX6+7iP0il8b4Z0QFqIwwMHfs/L6K1
vepuoxtGzi4CZ68zJpiq1UvSqTbFJjtbD4seiMHl
-----END CERTIFICATE-----
)PEM";

// ====== DEVICE ID (IMEI will overwrite if available) ======
String HW_UID = "dummy-device-wifi-001";

// ====== STATE / PERSIST ======
Preferences prefs;
String guardianMsisdn = "";   // learned from PAIR SMS sender
String deviceToken    = "";   // learned from /pair response

bool hasGuardian() { return guardianMsisdn.length() >= 7; }
bool hasToken()    { return deviceToken.length()   >  0; }

void saveGuardian(const String& n){ prefs.begin("soteria", false); prefs.putString("guardian", n); prefs.end(); }
String loadGuardian(){ prefs.begin("soteria", true); String s=prefs.getString("guardian",""); prefs.end(); return s; }
void clearGuardian(){ prefs.begin("soteria", false); prefs.remove("guardian"); prefs.end(); }
void saveToken(const String& t){ prefs.begin("soteria", false); prefs.putString("devtoken", t); prefs.end(); }
String loadToken(){ prefs.begin("soteria", true); String s=prefs.getString("devtoken",""); prefs.end(); return s; }
void clearToken(){ prefs.begin("soteria", false); prefs.remove("devtoken"); prefs.end(); }

// Default SMS destination (guardian if paired, otherwise ADMIN)
inline const char* smsDest() { return hasGuardian() ? guardianMsisdn.c_str() : ADMIN_NUMBER; }

// ====== LED helpers (RGB is active-LOW on your board) ======
inline void ledRaw(bool r, bool g, bool b){
  digitalWrite(RED_PIN,   !r);
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

// ====== Motor helpers (polarity-safe) + watchdog ======
inline void motorWrite(bool on) {
  digitalWrite(MOTOR_PIN, MOTOR_ACTIVE_HIGH ? (on ? HIGH : LOW)
                                            : (on ? LOW  : HIGH));
}
inline void vibOn(){ motorWrite(true); }
inline void vibOff(){ motorWrite(false); }

unsigned long vibUntilMs = 0;  // auto-off watchdog
inline void vibOnTimed(uint16_t ms){ vibOn(); vibUntilMs = millis() + ms; }
inline void vibTap(){ vibOnTimed(150); }
inline void vibDoubleTap(){ vibTap(); delay(150); vibTap(); }
inline void vibTripleTap(){ vibTap(); delay(150); vibTap(); delay(150); vibTap(); }
inline void vibBurst(){ vibOnTimed(500); }
inline void vibLong(){ vibOnTimed(2000); }

// ====== SMS routing watchdog (robust on A7670) ======
bool smsRouted = false;
unsigned long smsConfigT0 = 0;
bool cnmiAltTried = false;

// ====== STATUS (for LED base) ======
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

// ====== NETWORK (WiFi/TLS) ======
WiFiClientSecure tls;

// ====== SMALL JSON UTIL ======
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
  SerialMon.print("POST "); SerialMon.println(url);

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

  Serial.printf("HTTP %d\n", status);
  Serial.println(respOut);
  return status >= 200 && status < 300;
}
bool postWithBackoff(const char* path, const String& json, String& resp){
  uint16_t waitMs = 600;
  for (uint8_t i = 0; i < 3; i++) {
    if (httpPostJson(path, json, resp)) return true;
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
const uint16_t SMS_SETTLE_MS = 2000; // increased as requested

// ====== API CALLS ======
// --- Ingest FIRST (so it's visible when called from pairDevice) ---
bool ingestEvent(const char* type, const char* message, float lat=NAN, float lng=NAN){
  if (!hasToken()) {
    SerialMon.println(String("[INGEST] SUPPRESSED (not paired yet). type=") + type);
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

  SerialMon.print("INGEST payload: "); SerialMon.println(payload);
  String resp;
  bool ok = postWithBackoff(PATH_INGEST, payload, resp);

  SerialMon.println(ok ? "Ingest OK" : "Ingest FAILED");
  SerialMon.print("INGEST resp: "); SerialMon.println(resp);
  return ok;
}

// --- Pair AFTER ingestEvent so calls compile fine ---
bool pairDevice(const String& code, const char* model){
  String payload = "{\"code\":\""+code+"\",\"hw_uid\":\""+HW_UID+"\",\"model\":\""+String(model)+"\"}";
  SerialMon.print("PAIR payload: "); SerialMon.println(payload);
  String resp;
  bool ok = postWithBackoff(PATH_PAIR, payload, resp);
  SerialMon.println(ok ? "Pair OK" : "Pair FAILED");
  SerialMon.print("PAIR resp: "); SerialMon.println(resp);
  if (ok){
    String tok = jsonGetStr(resp, "device_token");
    if (tok.length()){
      deviceToken = tok;
      saveToken(deviceToken);
      SerialMon.print("Saved device_token: "); SerialMon.println(deviceToken);

      // Now that we're paired, send confirm + first heartbeat (with coords)
      ingestEvent("PAIR_OK", "Device paired successfully", (float)FIXED_LAT, (float)FIXED_LNG);
      delay(500); // Brief pause between events
      ingestEvent("HEALTH", "Post-pair heartbeat - all systems operational");
    } else {
      SerialMon.println("ERROR: No device_token in pair response");
      return false;
    }
  }
  return ok;
}

// ====== SMS send with LED/vibe feedback (IMPROVED) ======
bool sendSMS_withFeedback(const char* number, const char* msg) {
  vibDoubleTap();
  unsigned long startMs = millis();
  while (millis() - startMs < 600) { if (blinkOn(100)) ledGreen(); else ledOff(); delay(10); }

  // === ADDED: quick self-heal to ensure network attach so isNetworkConnected() becomes true
  if (!modem.isNetworkConnected()) {
    SerialMon.println("Network not connected, attempting to reconnect...");
    modem.sendAT("+CFUN=1");  modem.waitResponse();   // full RF on
    modem.sendAT("+CPIN?");   modem.waitResponse();   // ensure SIM ready
    modem.sendAT("+COPS=0");  modem.waitResponse();   // auto-select operator
    modem.sendAT("+CGATT=1"); modem.waitResponse();   // attach PDP (satisfy isNetworkConnected)
    unsigned long t = millis();
    while (!modem.isNetworkConnected() && millis() - t < 8000) { delay(250); }
  }
  // === END ADDED

  // --- Check SIM and network before sending ---
  int simStatus = modem.getSimStatus();
  bool netOK = modem.isNetworkConnected();
  bool simReady = (simStatus == 1 || simStatus == 3); 
  SerialMon.print("SIM status: "); SerialMon.println(simStatus);
  SerialMon.print("Network connected: "); SerialMon.println(netOK ? "YES" : "NO");

  if (simStatus != 3 || !netOK) {
    // Optional extra debug:
    modem.sendAT("+CREG?"); modem.waitResponse();
    modem.sendAT("+CSQ");   modem.waitResponse();
    modem.sendAT("+CSCA?"); modem.waitResponse(); // SMSC check
    ledRed(); vibTripleTap(); delay(300);
    SerialMon.println("Aborting SMS: SIM/network not ready.");
    return false;
  }

  SerialMon.print("Sending SMS to: "); SerialMon.println(number);
  SerialMon.print("Message: "); SerialMon.println(msg);

  bool ok = modem.sendSMS(number, msg);
  SerialMon.print("modem.sendSMS() returned: "); SerialMon.println(ok ? "OK" : "FAIL");

  if (ok) { 
    ledBlue(); 
    vibBurst(); 
    delay(300); 
    SerialMon.println("SMS sent successfully");
  }
  else { 
    ledRed();  
    vibTripleTap(); 
    delay(300); 
    SerialMon.println("SMS send failed");
  }

  return ok;
}

// ====== Inbound SMS helpers ======
static String extractQuoted(const String& s){
  int a = s.indexOf('\"'); if (a < 0) return "";
  int b = s.indexOf('\"', a+1); if (b < 0) return "";
  return s.substring(a+1, b);
}

// ====== SMS parser (robust) ======
void processInboundSms(const String& fromMsisdn, String body){
  SerialMon.print("Incoming SMS from "); SerialMon.print(fromMsisdn);
  SerialMon.print(": "); SerialMon.println(body);
  startEvent(EV_IN_SMS, 1200);

  String norm = body; norm.trim();
  while (norm.indexOf("  ") >= 0) norm.replace("  "," ");
  String upper = norm; upper.toUpperCase();

  if (upper.startsWith("PAIR")) {
    String code = "";
    int sp = upper.indexOf(' ');
    if (sp > 0) code = norm.substring(sp+1);
    if (code.length()==0){
      int p = norm.indexOf(':'); if (p<0) p = norm.indexOf('-');
      if (p>0) code = norm.substring(p+1);
    }
    code.trim();
    
    SerialMon.print("Extracted pair code: "); SerialMon.println(code);

    if (WiFi.status()!=WL_CONNECTED){
      sendSMS_withFeedback(fromMsisdn.c_str(), "ERROR: No WiFi connection. Please connect device to WiFi and retry pairing.");
      return;
    }
    
    if (code.length() == 0) {
      sendSMS_withFeedback(fromMsisdn.c_str(), "ERROR: No pairing code provided. Send 'PAIR <code>' format.");
      return;
    }
    
    SerialMon.println("Attempting to pair device...");
    bool ok = pairDevice(code, "ESP32+A7670+WiFi");
    if (ok) {
      guardianMsisdn = fromMsisdn; 
      saveGuardian(guardianMsisdn);
      String confirmMsg = "SUCCESS: Device paired! Guardian: " + fromMsisdn;
      sendSMS_withFeedback(guardianMsisdn.c_str(), confirmMsg.c_str());
      SerialMon.println("Pairing completed successfully");
    } else {
      sendSMS_withFeedback(fromMsisdn.c_str(), "ERROR: Pairing failed. Check code and try again.");
      SerialMon.println("Pairing failed");
    }

  } else if (upper=="OTW") {
    SerialMon.println("Received OTW (On The Way) message");
    startEvent(EV_OTW, 5000);
    ingestEvent("OTW", ("Guardian responding - from:" + fromMsisdn).c_str(), (float)FIXED_LAT, (float)FIXED_LNG);

  } else if (upper=="UNPAIR") {
    if (hasGuardian() && fromMsisdn == guardianMsisdn) {
      SerialMon.println("Authorized unpair request received");
      clearGuardian(); clearToken();
      guardianMsisdn = ""; deviceToken = "";
      ingestEvent("UNPAIR_OK", ("Unpaired by guardian:" + fromMsisdn).c_str());
      sendSMS_withFeedback(fromMsisdn.c_str(), "Device unpaired successfully. Reverting to admin-only mode.");
    } else {
      SerialMon.println("Unauthorized unpair attempt");
      ingestEvent("UNPAIR_DENY", ("Unauthorized unpair attempt from:" + fromMsisdn).c_str());
      sendSMS_withFeedback(fromMsisdn.c_str(), "ERROR: Not authorized to unpair this device.");
    }

  } else if (upper=="PING" || upper=="STATUS") {
    SerialMon.println("Status ping received");
    String statusMsg = "PONG - Status OK. Battery: " + String(getBatteryLevel(), 1) + "%, Signal: " + String(getSignalStrength());
    statusMsg += ", Location: " + formatCoords();
    sendSMS_withFeedback(fromMsisdn.c_str(), statusMsg.c_str());
    ingestEvent("HEALTH", ("Status ping from:" + fromMsisdn).c_str(), (float)FIXED_LAT, (float)FIXED_LNG);

  } else {
    SerialMon.println("Unrecognized SMS command, logging as general message");
    ingestEvent("IN_SMS", ("Unknown command: " + body + " from:" + fromMsisdn).c_str());
  }
}

// ====== READ + POLL SMS ======
void readIncomingSMS(){
  while (SerialAT.available()) {
    String line = SerialAT.readStringUntil('\n'); line.trim();
    if (!line.length()) continue;

    if (line.startsWith("+CMT:")) {             // direct to TE
      smsRouted = true;
      String fromMsisdn = extractQuoted(line);
      String body = SerialAT.readStringUntil('\n'); body.trim();
      processInboundSms(fromMsisdn, body);
      continue;
    }
    if (line.startsWith("+CMTI:")) {            // stored in memory
      smsRouted = true;
      int comma = line.lastIndexOf(',');
      if (comma > 0) {
        int idx = line.substring(comma+1).toInt();
        modem.sendAT("+CMGR=", idx);
        String hdr;
        unsigned long t0 = millis();
        while (millis() - t0 < 4000) {
          if (!SerialAT.available()) { delay(10); continue; }
          hdr = SerialAT.readStringUntil('\n'); hdr.trim();
          if (hdr.startsWith("+CMGR:")) break;
        }
        if (hdr.startsWith("+CMGR:")) {
          String fromMsisdn = extractQuoted(hdr);
          String body = SerialAT.readStringUntil('\n'); body.trim();
          processInboundSms(fromMsisdn, body);
          modem.sendAT("+CMGD=", idx); modem.waitResponse();
        } else {
          SerialMon.println("Warn: CMGR timeout/format");
        }
      }
      continue;
    }
    if (line.startsWith("+")) { SerialMon.print("URC: "); SerialMon.println(line); }
  }
}

// Poll unread inbox in case URCs are lost
void smsPollUnread() {
  modem.sendAT("+CMGL=\"REC UNREAD\"");
  String line;
  String from, body;
  int idx = -1;
  unsigned long t0 = millis();

  while (millis() - t0 < 3000) {
    if (!SerialAT.available()) { delay(10); continue; }
    line = SerialAT.readStringUntil('\n'); line.trim();
    if (!line.length()) continue;

    if (line.startsWith("+CMGL:")) {
      int c1 = line.indexOf(':');
      int c2 = line.indexOf(',');
      if (c1>0 && c2>c1) idx = line.substring(c1+1, c2).toInt();
      from = extractQuoted(line);
      // next line = body
      unsigned long t1 = millis();
      while (SerialAT.available() == 0 && millis() - t1 < 1000) delay(5);
      body = SerialAT.readStringUntil('\n'); body.trim();
      if (from.length() && body.length()) {
        processInboundSms(from, body);
        if (idx >= 0) { modem.sendAT("+CMGD=", idx); modem.waitResponse(); }
      }
      continue;
    }
    if (line == "OK" || line == "ERROR") break;
  }
}

// ====== TIME (TLS needs correct RTC) ======
bool syncTime(uint32_t maxWaitMs = 20000) {
  SerialMon.println("Syncing time for TLS...");
  configTime(0, 0, "pool.ntp.org", "time.google.com", "time.cloudflare.com");
  time_t now = 0;
  uint32_t t0 = millis();
  while (now < 1700000000 && (millis() - t0) < maxWaitMs) { delay(200); time(&now); }
  if (now < 1700000000) { 
    SerialMon.println("WARN: NTP time NOT synced. TLS may fail."); 
    return false; 
  }
  SerialMon.println("Time synced successfully.");
  return true;
}

// ====== POLLERS ======
unsigned long lastNetPollMs = 0;
unsigned long lastHealth = 0;
unsigned long lastSmsPollMs = 0;

// OK/SEARCH/SIM_LOCK from cellular network
void pollNetwork(){
  int sim = modem.getSimStatus();
  bool simReady = (sim == 1 || sim == 3);  // accept both
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

// ====== SETUP ======
void setup(){
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);
  pinMode(MOTOR_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  ledOff();
  vibOff();

  SerialMon.begin(115200);
  delay(100);
  SerialMon.println("=== SOTERIA ESP32 DEVICE STARTING ===");

  // --- Bring up modem for SMS (NO data attach needed) ---
  SerialMon.println("Initializing A7670 modem...");
  pinMode(MODEM_POWER_ON, OUTPUT); digitalWrite(MODEM_POWER_ON, HIGH);
  pinMode(MODEM_RESET_PIN, OUTPUT); digitalWrite(MODEM_RESET_PIN, !MODEM_RESET_LEVEL); delay(100);
  digitalWrite(MODEM_RESET_PIN, MODEM_RESET_LEVEL); delay(2600);
  digitalWrite(MODEM_RESET_PIN, !MODEM_RESET_LEVEL);
  pinMode(MODEM_PWKEY, OUTPUT); digitalWrite(MODEM_PWKEY, LOW); delay(100);
  digitalWrite(MODEM_PWKEY, HIGH); delay(1000); digitalWrite(MODEM_PWKEY, LOW);

  SerialAT.begin(115200, SERIAL_8N1, MODEM_RX, MODEM_TX);
  SerialAT.setTimeout(50); // don't stall on reads
  delay(3000);
  
  SerialMon.println("Initializing modem...");
  if (!modem.init()) {
    SerialMon.println("ERROR: Modem initialization failed");
    while(1) { delay(1000); }
  }
  SerialMon.println("Modem initialized successfully");

  // === ADDED: bring RF to full, auto-operator, and wait for registration quickly
  modem.sendAT("+CFUN=1");  modem.waitResponse();
  modem.sendAT("+CPIN?");   modem.waitResponse();
  modem.sendAT("+COPS=0");  modem.waitResponse();
  // quick registration poke (doesn't block your existing loop)
  for (uint8_t i=0; i<5; ++i) { modem.sendAT("+CREG?"); modem.waitResponse(); delay(500); }
  // === END ADDED

  // IMEI for HW_UID
  String imei = modem.getIMEI(); 
  if (imei.length() > 0) {
    HW_UID = imei;
    SerialMon.print("Using IMEI as HW_UID: ");
  } else {
    SerialMon.print("Using default HW_UID: ");
  }
  SerialMon.println(HW_UID);

  // Wait for network so SMS can arrive
  SerialMon.println("Waiting for cellular network registration...");
  unsigned long t0 = millis();
  while (!modem.isNetworkConnected() && millis() - t0 < 30000) { 
    SerialMon.print("."); 
    delay(1000); 
  }
  SerialMon.println();

  // Ensure PDP not attached (we don't need data for SMS)
  modem.sendAT("+CGATT=0"); modem.waitResponse();

  // === ADDED: attach PDP so TinyGSM isNetworkConnected() flips to true for your checks
  modem.sendAT("+CGATT=1"); modem.waitResponse();
  // small settle
  for (uint8_t i=0; i<10 && !modem.isNetworkConnected(); ++i) { delay(300); }
  // === END ADDED

  if (modem.isNetworkConnected()) {
    SerialMon.println("Cellular network connected successfully");
  } else {
    SerialMon.println("WARNING: Cellular network not connected - SMS may not work");
  }

  // --- SMS config (robust) ---
  SerialMon.println("Configuring SMS settings...");
  modem.sendAT("E0");                      modem.waitResponse();  // no echo
  modem.sendAT("+CMEE=2");                 modem.waitResponse();  // verbose errors
  modem.sendAT("+CMGF=1");                 modem.waitResponse();  // text mode
  modem.sendAT("+CSCS=\"GSM\"");           modem.waitResponse();  // charset
  modem.sendAT("+CPMS=\"ME\",\"ME\",\"ME\"");  modem.waitResponse(); // prefer ME storage
  modem.sendAT("+CNMI=2,2,0,0,0");         modem.waitResponse();  // direct-to-TE

  // Debug current settings
  modem.sendAT("+CNMI?"); modem.waitResponse();
  modem.sendAT("+CPMS?"); modem.waitResponse();

  smsConfigT0 = millis();
  smsRouted = false; cnmiAltTried = false;

  // --- Wi-Fi for HTTPS ---
  SerialMon.print("Connecting to WiFi: "); SerialMon.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  uint32_t tw = millis();
  while (WiFi.status()!=WL_CONNECTED && millis()-tw<15000){ 
    delay(300); 
    SerialMon.print("."); 
  }
  SerialMon.println();
  
  if (WiFi.status()==WL_CONNECTED) { 
    SerialMon.print("WiFi connected! IP: "); 
    SerialMon.println(WiFi.localIP()); 
  } else { 
    SerialMon.println("WiFi connection failed - device pairing will not work"); 
  }

  // TLS prerequisites
  bool timeOk = syncTime();
  if (TLS_INSECURE) { 
    tls.setInsecure(); 
    SerialMon.println("TLS WARNING: INSECURE mode (no certificate validation)"); 
  } else { 
    tls.setCACert(SUPABASE_CA_PEM); 
    SerialMon.println("TLS: Using certificate validation");
  }
  tls.setTimeout(25000);

  // Load persisted data
  guardianMsisdn = loadGuardian();
  deviceToken    = loadToken();
  SerialMon.print("Stored Guardian: "); SerialMon.println(hasGuardian() ? guardianMsisdn : "<none>");
  SerialMon.print("Device Token: "); SerialMon.println(hasToken() ? "<present>" : "<none>");
  
  if (hasGuardian() && hasToken()) {
    SerialMon.println("Device is already paired and ready");
    // Send startup notification
    if (WiFi.status() == WL_CONNECTED) {
      ingestEvent("HEALTH", "Device startup - system ready");
    }
  } else {
    SerialMon.println("Device not paired - waiting for PAIR SMS command");
  }
  
  SerialMon.println("=== SETUP COMPLETE - DEVICE READY ===");
}

// ====== LOOP ======
unsigned long lastBounceMs=0;
static int lastState = HIGH;  // button state

void loop(){
  unsigned long now=millis();

  // Motor auto-off watchdog
  if (vibUntilMs && (long)(now - vibUntilMs) >= 0) { vibOff(); vibUntilMs = 0; }

  // Pollers
  if (now - lastNetPollMs > 5000) { lastNetPollMs = now; pollNetwork(); }

  // Button (short/long) with debounce
  int btn = digitalRead(BUTTON_PIN);
  if (btn != lastState && (now - lastBounceMs) > 30){
    lastBounceMs = now;
    if (btn == LOW){ pressStartMs = now; longPressLatched = false; }
    else {
      unsigned long dur = now - pressStartMs;
      if (!longPressLatched && dur>=50 && dur<=500){
        SerialMon.println("Short press detected → Sending button press alert");
        startEvent(EV_BTN_SHORT, 400);

        String msg = String("Button pressed! ") + formatCoords();
        bool smsSent = sendSMS_withFeedback(smsDest(), msg.c_str());
        // settle only if SMS actually went out
        if (smsSent) { delay(SMS_SETTLE_MS); }
        // Always ingest, even if SMS failed
        ingestEvent("BTN_SHORT", "Button pressed by user", (float)FIXED_LAT, (float)FIXED_LNG);
      }
    }
    lastState = btn;
  }
  if (btn==LOW && !longPressLatched && (now-pressStartMs)>=2000){
    SerialMon.println("LONG PRESS DETECTED → Sending SOS alert");
    longPressLatched = true;
    startEvent(EV_SOS, 4000);

    String msg = String("🚨 EMERGENCY SOS! ") + formatCoords();
    bool smsSent = sendSMS_withFeedback(smsDest(), msg.c_str());
    // settle only if SMS actually went out
    if (smsSent) { delay(SMS_SETTLE_MS); }
    // Always ingest, even if SMS failed
    ingestEvent("SOS", "Emergency SOS activated", (float)FIXED_LAT, (float)FIXED_LNG);
  }

  // Incoming SMS (PAIR/OTW/UNPAIR/PING/etc)
  readIncomingSMS();

  // -------- SMS routing fallback (after 15s with no URCs) --------
  if (!smsRouted && !cnmiAltTried && (now - smsConfigT0 > 15000)) {
    SerialMon.println("SMS: switching to CNMI=1,2 + CPMS=SM fallback");
    modem.sendAT("+CNMI=1,2,0,0,0"); modem.waitResponse();            // store + notify
    modem.sendAT("+CPMS=\"SM\",\"SM\",\"SM\""); modem.waitResponse(); // SIM storage
    modem.sendAT("+CNMI?"); modem.waitResponse();
    modem.sendAT("+CPMS?"); modem.waitResponse();
    cnmiAltTried = true;
  }
  // ---------------------------------------------------------------

  // Unread inbox poller (saves you if URCs are lost)
  if (now - lastSmsPollMs > 8000) {
    lastSmsPollMs = now;
    smsPollUnread();
  }

  // periodic health (enhanced with device metrics)
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

  renderBaseStatus();
  delay(10);
}

// ====== EVENTS ======
void startEvent(EventType ev, unsigned long durationMs){
  currentEvent = ev; eventUntilMs = millis() + durationMs;
  switch(ev){
    case EV_BTN_SHORT: vibTap(); break;
    case EV_SOS:       vibLong(); break;
    case EV_IN_SMS:    vibDoubleTap(); break;
    case EV_OTW:       vibBurst(); break;
    default: break;
  }
}

void renderEvent(){
  switch(currentEvent){
    case EV_BTN_SHORT: if (inWindow(400,200)) ledWhite(); else ledOff(); break;
    case EV_SOS:       if (blinkOn(100))      ledWhite(); else ledOff(); break;
    case EV_IN_SMS:    if (inWindow(600,200)||(millis()%1200>600&&(millis()%1200)<800)) ledBlue(); else ledOff(); break;
    case EV_OTW:       ledBlue(); break;
    default: break;
  }
}