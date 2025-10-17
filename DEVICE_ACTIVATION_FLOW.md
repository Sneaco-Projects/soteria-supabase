# 🚀 Automated Device Activation Flow

## 📱 Customer Experience
1. **Receive Device**: Customer gets device with QR code on box
2. **Scan QR Code**: Opens activation page with device info pre-filled
3. **Submit**: Customer confirms device received and location
4. **Wait**: Device appears in architect activation queue

## 🏗️ Architect Experience
1. **Check Queue**: See pending devices with customer info
2. **One-Click Activate**: Press "✅ Activate Device" button
3. **Done**: Device becomes available for pairing

---

## 🔧 Technical Implementation

### 1. QR Code Format
```
https://soteria.io/activate?device=IMEI_HERE&batch=BATCH_ID
```

### 2. Database Tables

#### `device_activations` (New Table)
```sql
CREATE TABLE device_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hw_uid text NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  shipping_address text NOT NULL,
  activation_requested_at timestamp DEFAULT now(),
  activated_at timestamp NULL,
  activated_by uuid NULL,
  status text DEFAULT 'pending', -- pending, activated, rejected
  notes text NULL
);
```

#### Update `devices` table
```sql
ALTER TABLE devices ADD COLUMN activation_id uuid REFERENCES device_activations(id);
ALTER TABLE devices ADD COLUMN batch_id text NULL;
```

### 3. Customer Activation Page
**Route**: `/activate?device=XXXX&batch=YYYY`

**Form Fields**:
- Device ID (pre-filled, read-only)
- Customer Name*
- Email*
- Phone*
- Shipping Address*
- Installation Location
- Special Notes

### 4. Architect Dashboard Enhancement
**New Tab**: "Device Activations"

**Features**:
- List of pending activations
- Customer contact info
- One-click activation
- Bulk activation for multiple devices
- Rejection with reason

---

## 🎯 Activation Workflow

### Customer Side:
```
📱 Scan QR → Fill Form → Submit → Wait for Activation
```

### Architect Side:
```
📋 Review Request → Verify Info → Click "Activate" → Device Ready
```

### System Side:
```
🔄 Create Activation Record → Notify Architect → Update Device Status → Send Confirmation
```

---

## 📊 Benefits

### For Customers:
- ✅ Simple QR code scanning
- ✅ No technical knowledge needed
- ✅ Automatic notification when ready

### For Architects:
- ✅ All info pre-filled
- ✅ One-click activation
- ✅ Batch processing capability
- ✅ Full audit trail

### For System:
- ✅ Automated data collection
- ✅ Reduced manual errors
- ✅ Better tracking
- ✅ Scalable process

---

## 🚀 Advanced Features (Future)

### Smart Activation:
- Auto-activate devices from trusted customers
- Geo-location verification
- Photo verification of installation

### Integration:
- Connect with shipping APIs
- E-commerce order integration
- SMS/Email notifications

### Analytics:
- Activation time tracking
- Customer satisfaction surveys
- Device distribution maps