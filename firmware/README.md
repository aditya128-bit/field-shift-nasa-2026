# ESP32 + RS485 8-in-1 Soil Sensor Field Telemetry Node

This module provides edge sensing capabilities for the **Field Shift: Adapting Farms with NASA Data** solution.

## Overview
The edge node integrates an **ESP32 microcontroller** with an **Industrial 8-in-1 Soil Sensor** using RS485 Modbus RTU protocol to capture hyper-local ground truth metrics:
1. **Soil Moisture** (%)
2. **Soil Temperature** (°C)
3. **Electrical Conductivity (EC)** (µS/cm)
4. **Soil pH** (pH units)
5. **Nitrogen (N)** (mg/kg)
6. **Phosphorus (P)** (mg/kg)
7. **Potassium (K)** (mg/kg)
8. **Salinity / Total Dissolved Solids** (mg/L)

Ground telemetry is combined with NASA Earth Observation satellites (SMAP, GPM IMERG, Landsat/MODIS, NASA POWER) to bridge the scale gap between orbital observations and root-zone realities.

---

## Hardware Bill of Materials (BOM)
| Component | Specification | Purpose |
|---|---|---|
| **Microcontroller** | ESP32 DevKit V1 (30-pin or 38-pin) | WiFi connectivity, Modbus processing, edge telemetry |
| **Soil Sensor** | Industrial RS485 Modbus RTU 8-in-1 Sensor | High-precision soil physical & chemical measurements |
| **Transceiver** | MAX485 TTL to RS485 Module | Voltage and signal conversion between 3.3V/5V UART and RS485 differential pair |
| **Power Supply** | 12V 2A DC Adapter | Supplies required 9-24V DC to the industrial soil sensor |
| **Buck Converter / Regulator** | 12V to 5V Step-Down (or separate USB cable) | Powers ESP32 |

---

## Wiring & Pinout Guide

### 1. ESP32 to MAX485 Converter
- **ESP32 GPIO 16 (RX2)** ➔ **MAX485 RO (Receiver Output)**
- **ESP32 GPIO 17 (TX2)** ➔ **MAX485 DI (Driver Input)**
- **ESP32 GPIO 4** ➔ **MAX485 DE & RE (Tied together)**
- **ESP32 5V / 3.3V** ➔ **MAX485 VCC**
- **ESP32 GND** ➔ **MAX485 GND**

### 2. MAX485 to Soil Sensor
- **MAX485 A (Non-inverting)** ➔ **Sensor Yellow wire (RS485-A / 485+)**
- **MAX485 B (Inverting)** ➔ **Sensor Blue wire (RS485-B / 485-)**

### 3. Power Supply Connections
- **12V DC V(+)** ➔ **Sensor Brown wire (VCC 9-24V)**
- **12V DC GND(-)** ➔ **Sensor Black wire (GND)**
- **IMPORTANT**: Connect 12V DC GND to ESP32 GND to establish a **Common Ground**.

---

## Modbus RTU Communication Frame
- **Baud Rate**: 4800 bps or 9600 bps (configurable via sensor DIP/software)
- **Data Bits**: 8
- **Parity**: None
- **Stop Bits**: 1
- **Slave Address**: `0x01`
- **Function Code**: `0x03` (Read Holding Registers)
- **Request Frame**:
  `0x01, 0x03, 0x00, 0x00, 0x00, 0x08, 0x44, 0x0C`

---

## Software Setup & Flashing
1. Open the Arduino IDE.
2. Under **Board Manager**, install `esp32 by Espressif Systems`.
3. Select board: `ESP32 Dev Module`.
4. Open [field_shift_esp32_sensor.ino](file:///home/aditya-kumar-mishra/DTU-Projects/NASA/firmware/field_shift_esp32_sensor.ino).
5. Update `WIFI_SSID`, `WIFI_PASSWORD`, and `SERVER_URL` (IP of your Field Shift backend server).
6. Click **Upload**.
7. Open Serial Monitor at **115200 baud** to view real-time Modbus telemetry and HTTP POST transmission receipts.

> [!NOTE]
> If the sensor is not physically connected during bench testing or software development, the firmware automatically detects timeout and emits calibrated Indo-Gangetic / Delhi baseline telemetry so the complete web dashboard operates seamlessly.
