import React, { useState } from 'react';
import { Cpu, X, Copy, Check, Terminal, ExternalLink, Zap } from 'lucide-react';

export default function HardwareModal({ isOpen, onClose, onSendTestReading }) {
  const [copied, setCopied] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  if (!isOpen) return null;

  const sampleJson = {
    device_id: "ESP32_DELHI_FIELD_NODE_01",
    location: "Delhi-Pusa-Agri-Basin",
    soil_moisture: 24.5,
    soil_temperature: 25.8,
    electrical_conductivity: 510,
    ph: 7.75,
    nitrogen: 32,
    phosphorus: 19,
    potassium: 205,
    salinity: 325,
    sensor_mode: "hardware_rs485"
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(sampleJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateHardware = async () => {
    setSendingTest(true);
    try {
      await fetch('/api/sensor/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleJson)
      });
      if (onSendTestReading) onSendTestReading();
    } catch (e) {
      console.error(e);
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">ESP32 + 8-in-1 Soil Sensor Edge Node</h3>
              <p className="text-xs text-slate-400">RS485 Modbus RTU Edge Telemetry Architecture</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pinout Connections Table */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
            Hardware Wiring Connections
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950">
                  <th className="py-2 px-3">ESP32 DevKit Pin</th>
                  <th className="py-2 px-3">MAX485 Transceiver</th>
                  <th className="py-2 px-3">8-in-1 Soil Sensor</th>
                  <th className="py-2 px-3">Function</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                <tr>
                  <td className="py-2 px-3 text-cyan-300">GPIO 16 (RX2)</td>
                  <td className="py-2 px-3">RO (Receiver Out)</td>
                  <td className="py-2 px-3">-</td>
                  <td className="py-2 px-3 text-slate-400">UART Receive</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-cyan-300">GPIO 17 (TX2)</td>
                  <td className="py-2 px-3">DI (Driver In)</td>
                  <td className="py-2 px-3">-</td>
                  <td className="py-2 px-3 text-slate-400">UART Transmit</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-cyan-300">GPIO 4</td>
                  <td className="py-2 px-3">DE & RE (Tied)</td>
                  <td className="py-2 px-3">-</td>
                  <td className="py-2 px-3 text-slate-400">Modbus Direction Control</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">-</td>
                  <td className="py-2 px-3 text-amber-300">A Line</td>
                  <td className="py-2 px-3 text-amber-300">RS485-A (Yellow)</td>
                  <td className="py-2 px-3 text-slate-400">Differential RS485 (+)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">-</td>
                  <td className="py-2 px-3 text-blue-300">B Line</td>
                  <td className="py-2 px-3 text-blue-300">RS485-B (Blue)</td>
                  <td className="py-2 px-3 text-slate-400">Differential RS485 (-)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">GND</td>
                  <td className="py-2 px-3">GND</td>
                  <td className="py-2 px-3">Black Wire (GND)</td>
                  <td className="py-2 px-3 text-slate-400">Common Ground</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Firmware Location & API Payload */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              ESP32 HTTP Telemetry Payload (POST /api/sensor/data)
            </h4>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 text-xs text-slate-400 hover:text-cyan-300"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy JSON"}</span>
            </button>
          </div>

          <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-[11px] text-cyan-300 font-mono overflow-x-auto">
            {JSON.stringify(sampleJson, null, 2)}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            Firmware ready at: <code className="text-slate-300 bg-slate-950 px-2 py-0.5 rounded">firmware/field_shift_esp32_sensor.ino</code>
          </div>

          <button
            onClick={handleSimulateHardware}
            disabled={sendingTest}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-md shadow-cyan-600/30 flex items-center justify-center space-x-1.5 transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{sendingTest ? "Injecting..." : "Inject Real Hardware Pulse"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
