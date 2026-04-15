import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import * as THREE from "three";

const COLORS = {
  primary: "#ffffff",
  accent: "#d4a574",
  success: "#2ecc71",
  warning: "#f39c12",
  danger: "#e74c3c",
  bg: "#faf8f5",
  surface: "#ffffff",
  surfaceAlt: "#f5f2ed",
  border: "rgba(0, 0, 0, 0.08)",
  text: "#3a3a3a",
  muted: "#7a7a7a",
  beige: "#d4a574",
  darkBeige: "#b8885f",
  purple: "#ffffff",
  cream: "#faf8f5",
};

// Neumorphic Shadow Styles
const NEUMORPHIC = {
  shadowInput: "inset 1px 1px 3px rgba(0, 0, 0, 0.1), inset -1px -1px 3px rgba(255, 255, 255, 0.5)",
  shadowSmall: "0px 2px 8px rgba(0, 0, 0, 0.12)",
  shadowMedium: "0px 4px 12px rgba(0, 0, 0, 0.15)",
  shadowLarge: "0px 8px 16px rgba(0, 0, 0, 0.18)",
  shadowHover: "0px 6px 14px rgba(0, 0, 0, 0.2)",
  shadowActive: "inset 0px 2px 4px rgba(0, 0, 0, 0.1)",
};

const PATIENTS = [
  { id: "TRS-0021", name: "Subramani", age: 74, ward: "Geriatric Care", bed: "GC-04", condition: "Post-hip surgery", admitted: "2025-04-01", doctor: "Dr. Meera Nair", prototype: { deviceId: "TERESA-001", model: "v3.2", status: "Active", battery: 87 } },
  { id: "TRS-0034", name: "Rajarajan", age: 81, ward: "ICU", bed: "ICU-07", condition: "Stroke recovery", admitted: "2025-03-28", doctor: "Dr. Suresh Iyer", prototype: { deviceId: "TERESA-002", model: "v3.2", status: "Active", battery: 62 } },
  { id: "TRS-0047", name: "Jemima", age: 68, ward: "Neuro Ward", bed: "NW-02", condition: "Spinal injury", admitted: "2025-04-03", doctor: "Dr. Priya Balachandran", prototype: { deviceId: "TERESA-003", model: "v3.1", status: "Active", battery: 78 } },
  { id: "TRS-0058", name: "Singaperumal", age: 76, ward: "Geriatric Care", bed: "GC-11", condition: "Parkinson's disease", admitted: "2025-03-25", doctor: "Dr. Meera Nair", prototype: { deviceId: "TERESA-004", model: "v3.2", status: "Standby", battery: 45 } },
  { id: "TRS-0062", name: "James", age: 70, ward: "Rehab", bed: "RH-03", condition: "Knee replacement", admitted: "2025-04-05", doctor: "Dr. Arun Kumar", prototype: { deviceId: "TERESA-005", model: "v3.0", status: "Active", battery: 91 } },
];

const STAGES = ["IDLE", "COLLECTING", "THRESHOLD_REACHED", "NAVIGATING", "DISPOSING", "RETURNING", "DOCKED", "STERILIZING", "CYCLE_COMPLETE"];

const stageColors = {
  IDLE: "#9e9e9e",
  COLLECTING: "#424242",
  THRESHOLD_REACHED: "#757575",
  NAVIGATING: "#616161",
  DISPOSING: "#4d4d4d",
  RETURNING: "#5c5c5c",
  DOCKED: "#2d5a2d",
  STERILIZING: "#666666",
  CYCLE_COMPLETE: "#2d5a2d",
};

const stageIcons = {
  IDLE: "○", COLLECTING: "⬇", THRESHOLD_REACHED: "⚡", NAVIGATING: "→",
  DISPOSING: "↓", RETURNING: "←", DOCKED: "⬛", STERILIZING: "✦", CYCLE_COMPLETE: "✓",
};

function usePatientSimulations() {
  const [activePatient, setActivePatient] = useState(0);
  const [sosActive, setSosActive] = useState(false);
  
  // Store data for all patients
  const patientsDataRef = useRef({});
  const [patientStates, setPatientStates] = useState({});

  // Initialize patient data
  useEffect(() => {
    const initializePatient = (patientIdx) => {
      if (!patientsDataRef.current[patientIdx]) {
        const initialLevels = [23, 45, 12, 67, 34];
        const initialStages = ["COLLECTING", "NAVIGATING", "DOCKED", "COLLECTING", "STERILIZING"];
        const initialBatteries = [87, 62, 45, 91, 58];
        const initialCycles = [14, 8, 22, 5, 18];

        patientsDataRef.current[patientIdx] = {
          urineLevel: initialLevels[patientIdx] || 23,
          stage: initialStages[patientIdx] || "COLLECTING",
          stageIdx: STAGES.indexOf(initialStages[patientIdx] || "COLLECTING"),
          batteryLevel: initialBatteries[patientIdx] || 87,
          wifiStrength: 92,
          cycleCount: initialCycles[patientIdx] || 14,
          logs: [
            { time: "09:41:02", msg: "System initialized. Sensors calibrated.", type: "info" },
            { time: "09:41:15", msg: `${PATIENTS[patientIdx].id}: Collection started.`, type: "info" },
            { time: "09:43:22", msg: "Fluid level: monitoring active.", type: "info" },
          ],
        };
      }
    };

    PATIENTS.forEach((_, idx) => initializePatient(idx));
    setPatientStates({ ...patientsDataRef.current });
  }, []);

  // Simulation loop for all patients
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedData = { ...patientsDataRef.current };

      PATIENTS.forEach((_, patientIdx) => {
        const data = updatedData[patientIdx];
        if (!data) return;

        // Update urine level per patient
        data.urineLevel = Math.min(
          Math.max(0, data.urineLevel + (Math.random() * 0.08 - 0.01)),
          95
        );

        // Auto-progression through stages
        if (data.urineLevel >= 80) {
          const ni = (data.stageIdx + 1) % STAGES.length;
          data.stageIdx = ni;
          data.stage = STAGES[ni];
          const now = new Date().toLocaleTimeString("en-GB");
          data.logs = [...data.logs.slice(-19), { 
            time: now, 
            msg: `Stage changed → ${data.stage}`, 
            type: data.stage === "STERILIZING" ? "warn" : data.stage === "CYCLE_COMPLETE" ? "success" : "info" 
          }];
          if (data.stage === "CYCLE_COMPLETE") {
            data.cycleCount++;
            data.urineLevel = 10;
          }
        }

        // Battery drain
        data.batteryLevel = Math.max(20, data.batteryLevel - 0.05);

        // WiFi fluctuation
        data.wifiStrength = 85 + Math.round(Math.sin(Date.now() / 3000) * 7);
      });

      patientsDataRef.current = updatedData;
      setPatientStates({ ...updatedData });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const addLog = (msg, type = "info") => {
    const now = new Date().toLocaleTimeString("en-GB");
    const data = patientsDataRef.current[activePatient];
    if (data) {
      data.logs = [...data.logs.slice(-19), { time: now, msg, type }];
      setPatientStates({ ...patientsDataRef.current });
    }
  };

  const currentPatientData = patientStates[activePatient] || {};

  return {
    urineLevel: currentPatientData.urineLevel || 0,
    stage: currentPatientData.stage || "IDLE",
    batteryLevel: currentPatientData.batteryLevel || 100,
    wifiStrength: currentPatientData.wifiStrength || 92,
    cycleCount: currentPatientData.cycleCount || 0,
    logs: currentPatientData.logs || [],
    activePatient,
    setActivePatient,
    addLog,
    sosActive,
    setSosActive,
    allPatientData: patientsDataRef.current,
  };
}

function NavBar({ activePage, setPage }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pages = ["Dashboard", "Monitor", "Patients", "Analytics", "Settings"];
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  return (
    <nav style={{ background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.purple}88)`, borderBottom: `1px solid ${COLORS.border}`, padding: isMobile ? "0 1rem" : "0 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: isMobile ? 60 : 70, position: "sticky", top: 0, zIndex: 100, fontFamily: "'Inter', sans-serif", boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }} 
          whileTap={{ scale: 0.95 }}
          style={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, borderRadius: 10, background: `linear-gradient(135deg, ${COLORS.beige}, ${COLORS.warning})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: isMobile ? 14 : 18, color: COLORS.primary, cursor: "pointer" }}>T</motion.div>
        {!isMobile && (
          <>
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{ color: "#000000", fontWeight: 600, fontSize: 16, letterSpacing: 0.5, fontFamily: "'Inter', sans-serif" }}>TERESA <span style={{ color: "#d4a574", fontWeight: 400, fontSize: 11 }}>Connect</span></motion.span>
            <motion.span 
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ fontSize: 10, background: `${COLORS.beige}35`, color: "#000000", padding: "2px 8px", borderRadius: 20, marginLeft: 4, fontWeight: 700 }}>● LIVE</motion.span>
          </>
        )}
      </div>
      
      {isMobile && (
        <motion.button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: "transparent", color: "#fff", border: "none", fontSize: 20, cursor: "pointer", padding: "8px 12px" }}>
          ☰
        </motion.button>
      )}
      
      <div style={{ display: isMobile && !mobileMenuOpen ? "none" : "flex", gap: isMobile ? 2 : 4, width: isMobile ? "100%" : "auto", flexWrap: isMobile ? "wrap" : "nowrap", order: isMobile ? 3 : 2, marginTop: isMobile && mobileMenuOpen ? "0.5rem" : 0 }}>
        {pages.map(p => (
          <motion.button 
            key={p} 
            whileHover={!isMobile ? { backgroundColor: `${COLORS.accent}10`, scale: 1.02 } : {}}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setPage(p); setMobileMenuOpen(false); }}
            style={{ background: activePage === p ? `${COLORS.beige}40` : "transparent", color: activePage === p ? "#000000" : "#1a1a1a", border: activePage === p ? `2px solid ${COLORS.beige}` : "none", padding: isMobile ? "6px 10px" : "8px 18px", borderRadius: 8, cursor: "pointer", fontSize: isMobile ? 11 : 13, fontWeight: activePage === p ? 700 : 600, fontFamily: "'Lato', 'Inter', sans-serif", transition: "all 0.3s ease", flex: isMobile ? "1 1 45%" : "auto" }}>
            {isMobile ? p.slice(0, 3).toUpperCase() : p}
          </motion.button>
        ))}
      </div>
      
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 16, order: 3 }}>
          <motion.div 
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#1a1a1a", fontFamily: "'Lato', 'Inter', sans-serif", fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.success, display: "inline-block", animation: "pulse 2s infinite" }}></span>
            ICAM Hospital
          </motion.div>
        </div>
      )}
    </nav>
  );
}

function UrineMeter({ level, stage }) {
  const getColor = () => {
    if (level < 40) return COLORS.success;
    if (level < 70) return COLORS.warning;
    return COLORS.danger;
  };
  return (
    <motion.div 
      whileHover={{ boxShadow: `0 8px 24px ${COLORS.accent}20` }}
      style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "1.5rem", display: "flex", flexDirection: "column", gap: 16, fontFamily: "'Lato', 'Inter', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: COLORS.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Urine Level</span>
        <motion.span 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, background: `${stageColors[stage]}22`, color: stageColors[stage], fontWeight: 600 }}>{stageIcons[stage]} {stage.replace(/_/g, " ")}</motion.span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
        <motion.div 
          layout
          style={{ position: "relative", width: 60, height: 140, borderRadius: 10, background: `${COLORS.accent}08`, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
          <motion.div 
            animate={{ height: `${level}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ position: "absolute", bottom: 0, width: "100%", background: `linear-gradient(to top, ${getColor()}, ${getColor()}88)`, borderRadius: "0 0 9px 9px" }}></motion.div>
          {[25, 50, 75].map(mark => (
            <div key={mark} style={{ position: "absolute", bottom: `${mark}%`, left: 0, right: 0, height: 1, background: `${COLORS.muted}20` }}></div>
          ))}
        </motion.div>
        <div>
          <motion.div 
            key={Math.round(level)}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ fontSize: 42, fontWeight: 700, color: getColor(), lineHeight: 1, fontFamily: "'Inter', sans-serif" }}>{Math.round(level)}<span style={{ fontSize: 18, color: COLORS.muted, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>%</span></motion.div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 4 }}>~{Math.round(level * 0.03 * 10) / 10}L collected</div>
          <motion.div 
            animate={{ color: level >= 70 ? COLORS.warning : COLORS.muted }}
            style={{ fontSize: 12, marginTop: 8, fontWeight: 500 }}>{level >= 80 ? "⚠ Auto-disposal triggered" : level >= 70 ? "⚡ Threshold approaching" : "● Monitoring active"}</motion.div>
        </div>
      </div>
      <div style={{ height: 6, background: `${COLORS.muted}10`, borderRadius: 3, overflow: "hidden" }}>
        <motion.div 
          animate={{ width: `${level}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ height: "100%", background: getColor(), borderRadius: 3 }}></motion.div>
      </div>
    </motion.div>
  );
}

function StageTimeline({ stage }) {
  const stageList = ["COLLECTING", "THRESHOLD_REACHED", "NAVIGATING", "DISPOSING", "RETURNING", "DOCKED", "STERILIZING"];
  const idx = stageList.indexOf(stage);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "2rem 1.5rem", fontFamily: "'Lato', 'Inter', sans-serif" }}>
      <div style={{ fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 24, fontWeight: 600 }}>Operational Stage</div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, justifyContent: "space-between", paddingTop: 8 }}>
        {stageList.map((s, i) => (
          <motion.div 
            key={s} 
            layout
            style={{ display: "flex", alignItems: "center", flexDirection: "column", gap: 12, flex: 1, minWidth: 0 }}>
            <motion.div 
              animate={{ 
                scale: i === idx ? [1, 1.1, 1] : 1,
                boxShadow: i === idx ? [`0 4px 16px ${stageColors[s]}40`, `0 8px 24px ${stageColors[s]}60`, `0 4px 16px ${stageColors[s]}40`] : "0 2px 8px rgba(0,0,0,0.06)"
              }}
              transition={{ duration: 1, repeat: i === idx ? Infinity : 0 }}
              style={{ 
                minWidth: 60, 
                height: 60, 
                borderRadius: 14, 
                background: i <= idx ? `linear-gradient(135deg, ${stageColors[s]}20, ${stageColors[s]}10)` : `${COLORS.muted}08`,
                border: `1.5px solid ${i <= idx ? `${stageColors[s]}40` : COLORS.border}`,
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: 18, 
                transition: "all 0.5s",
                position: "relative",
                overflow: "hidden",
                flexShrink: 0
              }}>
              {/* Glass shine effect */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0))", borderRadius: "14px 14px 0 0", pointerEvents: "none" }}></div>
              <span style={{ color: i <= idx ? stageColors[s] : COLORS.muted, fontSize: 22, fontWeight: 700, position: "relative", zIndex: 1 }}>
                {i < idx ? "✓" : stageIcons[s]}
              </span>
            </motion.div>
            <div style={{ 
              fontSize: 11, 
              color: i === idx ? "#3a3a3a" : i <= idx ? stageColors[s] : COLORS.muted, 
              textAlign: "center", 
              letterSpacing: 0.3, 
              fontWeight: i === idx ? 700 : 500, 
              minHeight: 50, 
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1.3,
              whiteSpace: "normal",
              wordBreak: "break-word",
              position: "relative",
              paddingBottom: i === idx ? 8 : 0,
              fontFamily: "'Lato', 'Inter', sans-serif"
            }}>
              {s.replace(/_/g, " ")}
              {i === idx && (
                <motion.div 
                  layoutId="underline"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5 }}
                  style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "#3a3a3a", borderRadius: 2, transformOrigin: "center" }}
                />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
      style={{ background: `linear-gradient(135deg, ${COLORS.surface}dd 0%, ${COLORS.surfaceAlt}dd 100%)`, backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", border: `1.5px solid rgba(212, 165, 116, 0.15)`, borderRadius: 20, padding: "1.5rem", fontFamily: "'Lato', 'Inter', sans-serif", cursor: "pointer", boxShadow: `0 8px 24px rgba(0, 0, 0, 0.1)`, transition: "all 0.3s ease" }}>
      <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{label}</div>
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ fontSize: 36, fontWeight: 700, color: color || COLORS.text, marginTop: 8, fontFamily: "'Inter', sans-serif" }}>{value}</motion.div>
      {sub && <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>{sub}</div>}
    </motion.div>
  );
}

function SOSButton({ active, onToggle, addLog, onEmergencyActivated }) {
  return (
    <motion.button 
      animate={{ 
        boxShadow: active ? [`0 0 20px ${COLORS.danger}66`, `0 0 40px ${COLORS.danger}99`, `0 0 20px ${COLORS.danger}66`] : "0 0 0px rgba(0,0,0,0)"
      }}
      transition={{ duration: 1, repeat: active ? Infinity : 0 }}
      onClick={() => { 
        const newActive = !active;
        onToggle(newActive);
        addLog(newActive ? "⚠ SOS ACTIVATED — Caregiver notified via SMS." : "SOS deactivated by operator.", newActive ? "warn" : "info");
        if (newActive && onEmergencyActivated) {
          onEmergencyActivated();
        }
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{ background: active ? COLORS.danger : `${COLORS.danger}15`, border: `2px solid ${active ? COLORS.danger : `${COLORS.danger}40`}`, color: active ? "#fff" : COLORS.danger, padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, width: "100%", transition: "all 0.3s", fontFamily: "'Inter', sans-serif" }}>
      {active ? "⚠ SOS ACTIVE — TAP TO CANCEL" : "☎ EMERGENCY SOS"}
    </motion.button>
  );
}

function EmergencyNotificationToast({ show, message, timestamp, phone }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: 20 }}
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : -20, x: show ? 0 : 20 }}
      exit={{ opacity: 0, y: -20, x: 20 }}
      transition={{ duration: 0.4 }}
      style={{
        position: "fixed",
        top: 80,
        right: 20,
        background: COLORS.surface,
        border: `2px solid ${COLORS.danger}`,
        borderRadius: 12,
        padding: "16px",
        boxShadow: `0 8px 32px ${COLORS.danger}40`,
        fontFamily: "'Inter', sans-serif",
        zIndex: 1000,
        maxWidth: 360,
        backdropFilter: "blur(10px)",
      }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: `${COLORS.danger}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
          }}>
          🚨
        </motion.div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.danger, marginBottom: 4 }}>EMERGENCY SOS ALERT</div>
          <div style={{ fontSize: 12, color: COLORS.text, marginBottom: 6 }}>{message}</div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 8 }}>📱 Notifying: <span style={{ fontWeight: 600, fontFamily: "monospace", color: COLORS.text }}>+91 {phone}</span></div>
          <div style={{ fontSize: 10, color: COLORS.muted }}>⏰ {timestamp}</div>
          <motion.div
            animate={{ width: ["0%", "100%"] }}
            transition={{ duration: 3, ease: "linear" }}
            style={{
              height: 2,
              background: COLORS.danger,
              borderRadius: 1,
              marginTop: 8,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function LogPanel({ logs }) {
  const endRef = useRef(null);
  // Removed auto-scroll to prevent page jumping when logs update
  const typeColor = { info: COLORS.muted, warn: COLORS.warning, success: COLORS.success, error: COLORS.danger };
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "1rem", height: 220, overflowY: "auto", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>System Log</div>
      {logs.map((l, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          style={{ display: "flex", gap: 10, fontSize: 12, marginBottom: 4 }}>
          <span style={{ color: COLORS.muted, fontFamily: "monospace", minWidth: 65, fontWeight: 500 }}>{l.time}</span>
          <span style={{ color: typeColor[l.type] || COLORS.text }}>{l.msg}</span>
        </motion.div>
      ))}
      <div ref={endRef} />
    </motion.div>
  );
}

function PatientRow({ p, active, onClick }) {
  return (
    <motion.div 
      whileHover={{ backgroundColor: `${COLORS.accent}10`, paddingLeft: 20 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick} 
      style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", background: active ? `${COLORS.accent}08` : "transparent", borderRadius: 10, cursor: "pointer", border: `1px solid ${active ? COLORS.accent : "transparent"}`, marginBottom: 4, transition: "all 0.2s", fontFamily: "'Inter', sans-serif" }}>
      <motion.div 
        animate={{ scale: active ? 1.1 : 1 }}
        style={{ width: 36, height: 36, borderRadius: "50%", background: `${COLORS.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: COLORS.accent, flexShrink: 0 }}>
        {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
      </motion.div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
        <div style={{ fontSize: 11, color: COLORS.muted }}>
          {p.id} · {p.ward} · <span style={{ fontWeight: 600, color: COLORS.accent }}>Device: {p.prototype.deviceId}</span>
        </div>
      </div>
      <motion.div 
        animate={{ scale: active ? 1.05 : 1 }}
        style={{ fontSize: 10, padding: "4px 10px", borderRadius: 20, background: active ? `${COLORS.accent}22` : `${COLORS.muted}10`, color: active ? COLORS.accent : COLORS.muted, fontWeight: 600, whiteSpace: "nowrap" }}>{p.bed}</motion.div>
    </motion.div>
  );
}

function PatientDetail({ p, urineLevel, stage, batteryLevel }) {
  return (
    <motion.div 
      whileHover={{ boxShadow: `0 8px 24px ${COLORS.accent}15` }}
      style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "1.5rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <motion.div 
          whileHover={{ scale: 1.1 }}
          style={{ width: 56, height: 56, borderRadius: "50%", background: `${COLORS.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: COLORS.accent }}>
          {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </motion.div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, fontFamily: "'Inter', sans-serif" }}>{p.name}</div>
          <div style={{ fontSize: 12, color: COLORS.muted }}>{p.id} · Age {p.age}</div>
        </div>
        <motion.div 
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ marginLeft: "auto", fontSize: 11, padding: "4px 12px", borderRadius: 20, background: `${COLORS.success}15`, color: COLORS.success, fontWeight: 600 }}>● Connected</motion.div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[["Ward", p.ward], ["Bed", p.bed], ["Doctor", p.doctor], ["Admitted", p.admitted], ["Condition", p.condition]].map(([k, v]) => (
          <motion.div 
            key={k}
            whileHover={{ paddingLeft: 4 }}
            style={{ fontFamily: "'Inter', sans-serif" }}>
            <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase" }}>{k}</div>
            <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>{v}</div>
          </motion.div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
        <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 12, fontWeight: 600 }}>TERESA Unit Status</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Urine Level", value: `${Math.round(urineLevel)}%`, color: urineLevel > 70 ? COLORS.warning : COLORS.success },
            { label: "Stage", value: stage, color: stageColors[stage] },
            { label: "Battery", value: `${Math.round(batteryLevel)}%`, color: batteryLevel < 30 ? COLORS.danger : COLORS.success }
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              whileHover={{ scale: 1.05, y: -2 }}
              style={{ background: COLORS.surface, borderRadius: 8, padding: "8px 12px", border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 10, color: COLORS.muted, fontWeight: 600 }}>{stat.label}</div>
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                style={{ fontSize: 20, fontWeight: 700, color: stat.color, fontFamily: "'Inter', sans-serif" }}>{stat.value}</motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function PieChart({ data, colors, title, size = 120 }) {
  const total = data.reduce((a, b) => a + b, 0);
  let cumulangle = 0;

  const slices = data.map((value, i) => {
    const sliceAngle = (value / total) * 360;
    const startAngle = cumulangle;
    const endAngle = cumulangle + sliceAngle;
    cumulangle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = size + size * Math.cos(startRad);
    const y1 = size + size * Math.sin(startRad);
    const x2 = size + size * Math.cos(endRad);
    const y2 = size + size * Math.sin(endRad);

    const largeArc = sliceAngle > 180 ? 1 : 0;
    const pathData = `M ${size} ${size} L ${x1} ${y1} A ${size} ${size} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return (
      <motion.path
        key={i}
        d={pathData}
        fill={colors[i % colors.length]}
        opacity="0.8"
        whileHover={{ opacity: 1, filter: "drop-shadow(0 0 8px rgba(0,0,0,0.2))" }}
      />
    );
  });

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 12, fontWeight: 600, textTransform: "uppercase" }}>{title}</div>
      <svg width={size * 2.5} height={size * 2.5} viewBox={`0 0 ${size * 2} ${size * 2}`}>
        {slices}
      </svg>
    </div>
  );
}

function BarChart({ data, labels, title, height = 150, color = COLORS.accent }) {
  const maxVal = Math.max(...data);
  return (
    <div>
      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 12, fontWeight: 600, textTransform: "uppercase" }}>{title}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: height, justifyContent: "space-around" }}>
        {data.map((value, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${(value / maxVal) * 100}%` }}
            transition={{ duration: 0.6, delay: i * 0.05 }}
            whileHover={{ scaleY: 1.05 }}
            style={{
              flex: 1,
              background: value > maxVal * 0.7 ? COLORS.warning : color,
              borderRadius: "4px 4px 0 0",
              cursor: "pointer",
              minHeight: 4,
              opacity: 0.85,
              position: "relative",
            }}
            title={`${labels[i]}: ${value}`}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8, fontSize: 9, color: COLORS.muted }}>
        {labels.map((label, i) => i % 4 === 0 && <span key={i}>{label}</span>)}
      </div>
    </div>
  );
}

function AnalyticsPage({ cycleCount }) {
  const [selectedUnit, setSelectedUnit] = useState(null); // null = all units, 0-4 = specific unit
  const hourlyData = [3, 5, 2, 1, 0, 0, 2, 7, 8, 6, 5, 4, 6, 7, 5, 4, 3, 5, 6, 4, 3, 2, 1, 2];
  const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  // Unit-specific data
  const unitCycleData = [14, 8, 22, 5, 18];
  const unitNames = ["TERESA-001", "TERESA-002", "TERESA-003", "TERESA-004", "TERESA-005"];

  // Distribution data - varies by unit
  const stageDistribution = selectedUnit !== null ? [24 - selectedUnit * 3, 18 - selectedUnit * 2, 15 + selectedUnit, 22 - selectedUnit] : [24, 18, 15, 22];
  const stageLabels = ["Collecting", "Navigating", "Disposing", "Docked"];
  const stageColorsChart = [COLORS.accent, COLORS.warning, COLORS.danger, COLORS.success];

  // System performance
  const performanceData = selectedUnit !== null ? [95 - selectedUnit * 2, 90 - selectedUnit, 98 - selectedUnit * 3, 87 + selectedUnit * 2, 92 - selectedUnit] : [95, 90, 98, 87, 92];
  const performanceLabels = ["Nav Acc", "Sensor", "Steril", "Battery", "Uptime"];

  // Device health distribution
  const healthMetrics = selectedUnit !== null ? [85 - selectedUnit * 3, 78 + selectedUnit * 2, 91 - selectedUnit] : [85, 78, 91];
  const healthLabels = ["Mechanical", "Electrical", "Software"];
  const healthColors = [COLORS.success, COLORS.warning, COLORS.accent];

  return (
    <div style={{ 
      padding: "2rem", 
      fontFamily: "'Lato', 'Inter', sans-serif",
      background: "linear-gradient(135deg, rgba(212, 165, 116, 0.08) 0%, rgba(200, 150, 100, 0.06) 25%, rgba(220, 180, 130, 0.07) 50%, rgba(210, 160, 110, 0.06) 75%, rgba(215, 170, 120, 0.07) 100%)",
      minHeight: "100%",
      backgroundAttachment: "fixed",
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box",
      overflow: "visible"
    }}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}>
        <div style={{ fontSize: 36, fontWeight: 600, color: COLORS.text, marginBottom: 6, fontFamily: "'Inter', sans-serif", textAlign: "center" }}>Analytics & Reports</div>
        <div style={{ fontSize: 14, color: COLORS.muted, marginBottom: 24, textAlign: "center" }}>System performance & disposal statistics {selectedUnit !== null && `- ${unitNames[selectedUnit]}`}</div>
      </motion.div>

      {/* Unit Selection */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        <motion.button 
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedUnit(null)}
          style={{ fontSize: 12, padding: "8px 16px", borderRadius: 8, border: `2px solid ${selectedUnit === null ? COLORS.accent : COLORS.border}`, background: selectedUnit === null ? `${COLORS.accent}15` : "transparent", color: selectedUnit === null ? COLORS.accent : COLORS.muted, cursor: "pointer", fontWeight: 600, fontFamily: "'Inter', sans-serif", transition: "all 0.3s" }}>
          📊 All Units
        </motion.button>
        {unitNames.map((name, idx) => (
          <motion.button 
            key={name}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedUnit(idx)}
            style={{ fontSize: 12, padding: "8px 16px", borderRadius: 8, border: `2px solid ${selectedUnit === idx ? COLORS.accent : COLORS.border}`, background: selectedUnit === idx ? `${COLORS.accent}15` : "transparent", color: selectedUnit === idx ? COLORS.accent : COLORS.muted, cursor: "pointer", fontWeight: 600, fontFamily: "'Inter', sans-serif", transition: "all 0.3s" }}>
            {name}
          </motion.button>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
        <StatCard 
          label="Total Cycles" 
          value={selectedUnit !== null ? unitCycleData[selectedUnit] : cycleCount} 
          sub={selectedUnit !== null ? unitNames[selectedUnit] : "Today"} 
          color={COLORS.accent} 
        />
        <StatCard 
          label="Avg Level" 
          value={selectedUnit !== null ? (64 - selectedUnit * 3) + "%" : "64%"} 
          sub="At disposal trigger" 
          color={COLORS.warning} 
        />
        <StatCard 
          label="Uptime" 
          value={selectedUnit !== null ? (99 - selectedUnit * 0.5) + "%" : "99.2%"} 
          sub="Last 30 days" 
          color={COLORS.success} 
        />
        <StatCard 
          label="Sterilizations" 
          value={selectedUnit !== null ? Math.floor(unitCycleData[selectedUnit] * 1.2) : cycleCount} 
          sub="UV-C cycles complete" 
          color={COLORS.accent} 
       
          color={COLORS.accent} 
        />
        <StatCard 
          label="Avg Level" 
          value={selectedUnit !== null ? (64 - selectedUnit * 3) + "%" : "64%"} 
          sub="At disposal trigger" 
          color={COLORS.warning} 
        />
        <StatCard 
          label="Uptime" 
          value={selectedUnit !== null ? (99 - selectedUnit * 0.5) + "%" : "99.2%"} 
          sub="Last 30 days" 
          color={COLORS.success} 
        />
        <StatCard 
          label="Sterilizations" 
          value={selectedUnit !== null ? Math.floor(unitCycleData[selectedUnit] * 1.2) : cycleCount} 
          sub="UV-C cycles complete" 
          color={COLORS.accent} 
        />
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 32 }}>
        {/* Hourly Bar Chart */}
        <motion.div 
          whileHover={{ boxShadow: `0 12px 32px ${COLORS.accent}40` }}
          style={{ background: `linear-gradient(135deg, ${COLORS.surface}dd 0%, ${COLORS.surfaceAlt}dd 100%)`, backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", border: `1.5px solid rgba(168, 85, 247, 0.2)`, borderRadius: 20, padding: "2rem", transition: "all 0.3s" }}>
          <BarChart 
            data={hourlyData}
            labels={labels}
            title="Disposal Events — 24H Timeline"
            height={200}
            color={COLORS.accent}
          />
        </motion.div>

        {/* Stage Distribution Pie */}
        <motion.div 
          whileHover={{ boxShadow: `0 12px 32px ${COLORS.accent}40` }}
          style={{ background: `linear-gradient(135deg, ${COLORS.surface}dd 0%, ${COLORS.surfaceAlt}dd 100%)`, backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", border: `1.5px solid rgba(168, 85, 247, 0.2)`, borderRadius: 20, padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
          <PieChart 
            data={stageDistribution}
            colors={stageColorsChart}
            title="Operation States"
            size={50}
          />
          <div style={{ marginTop: 16, fontSize: 11, color: COLORS.muted }}>
            {stageLabels.map((label, i) => (
              <div key={i} style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: stageColorsChart[i] }}></span>
                <span>{label}: {stageDistribution[i]}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Performance & Health Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 32 }}>
        {/* System Performance */}
        <motion.div 
          whileHover={{ y: -5, boxShadow: `0 12px 32px ${COLORS.accent}40` }}
          style={{ background: `linear-gradient(135deg, ${COLORS.surface}dd 0%, ${COLORS.surfaceAlt}dd 100%)`, backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", border: `1.5px solid rgba(168, 85, 247, 0.2)`, borderRadius: 20, padding: "2rem", transition: "all 0.3s" }}>
          <div style={{ fontSize: 14, color: COLORS.accent, marginBottom: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>System Performance</div>
          {performanceData.map((val, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: COLORS.text, fontWeight: 500 }}>{performanceLabels[i]}</span>
                <span style={{ color: COLORS.accent, fontWeight: 700 }}>{val}%</span>
              </div>
              <div style={{ height: 5, background: `rgba(255, 255, 255, 0.05)`, borderRadius: 3, overflow: "hidden" }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${val}%` }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  style={{ height: "100%", background: val >= 90 ? COLORS.success : COLORS.warning, borderRadius: 3 }}
                />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Device Health Pie */}
        <motion.div 
          whileHover={{ y: -5, boxShadow: `0 12px 32px ${COLORS.accent}40` }}
          style={{ background: `linear-gradient(135deg, ${COLORS.surface}dd 0%, ${COLORS.surfaceAlt}dd 100%)`, backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", border: `1.5px solid rgba(168, 85, 247, 0.2)`, borderRadius: 20, padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
          <PieChart 
            data={healthMetrics}
            colors={healthColors}
            title="Device Health"
            size={50}
          />
          <div style={{ marginTop: 16, fontSize: 11, color: COLORS.muted, textAlign: "center" }}>
            {healthLabels.map((label, i) => (
              <div key={i} style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: healthColors[i] }}></span>
                <span><strong>{label}:</strong> {healthMetrics[i]}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Infection Prevention */}
        <motion.div 
          whileHover={{ y: -5, boxShadow: `0 12px 32px ${COLORS.accent}40` }}
          style={{ background: `linear-gradient(135deg, ${COLORS.surface}dd 0%, ${COLORS.surfaceAlt}dd 100%)`, backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", border: `1.5px solid rgba(168, 85, 247, 0.2)`, borderRadius: 20, padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
          <div style={{ fontSize: 14, color: COLORS.accent, marginBottom: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Infection Prevention</div>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6 }}
            style={{ fontSize: 52, fontWeight: 800, color: COLORS.success, fontFamily: "'Inter', sans-serif", marginBottom: 12 }}>0</motion.div>
          <div style={{ fontSize: 12, color: COLORS.muted, textAlign: "center" }}>
            <div style={{ marginBottom: 8 }}>UTI incidents</div>
            <div style={{ fontSize: 11, color: COLORS.success, fontWeight: 600 }}>100% reduction vs baseline</div>
            <div style={{ marginTop: 8, fontSize: 11 }}>{cycleCount * 12}+ microbes eliminated</div>
          </div>
        </motion.div>
      </div>

      {/* Detailed Metrics */}
      <motion.div 
        whileHover={{ boxShadow: `0 12px 32px ${COLORS.accent}40` }}
        style={{ background: `linear-gradient(135deg, ${COLORS.surface}dd 0%, ${COLORS.surfaceAlt}dd 100%)`, backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", border: `1.5px solid rgba(168, 85, 247, 0.2)`, borderRadius: 20, padding: "2rem", transition: "all 0.3s" }}>
        <div style={{ fontSize: 14, color: COLORS.accent, marginBottom: 20, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Detailed Metrics</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { label: "Avg Cycle Time", value: "18.5 min", unit: "per unit" },
            { label: "Power Efficiency", value: "94.2", unit: "W/h" },
            { label: "Fluid Capacity", value: "3.0", unit: "Liters" },
            { label: "Maintenance Due", value: "45", unit: "days" },
          ].map((metric, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.05, y: -2 }}
              style={{ background: `rgba(255, 255, 255, 0.5)`, borderRadius: 16, padding: "1rem", border: `1px solid rgba(212, 165, 116, 0.1)`, transition: "all 0.3s" }}>
              <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{metric.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.accent, marginBottom: 4 }}>{metric.value}</div>
              <div style={{ fontSize: 10, color: COLORS.muted }}>{metric.unit}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function SettingsPage() {
  const [alerts, setAlerts] = useState({ sms: true, email: false, push: true });
  const [threshold, setThreshold] = useState(80);
  const [uvDuration, setUvDuration] = useState(5);
  return (
    <div style={{ padding: "2rem", fontFamily: "'Inter', sans-serif", width: "100%", maxWidth: "100%", boxSizing: "border-box", overflow: "visible" }}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ fontSize: 26, fontWeight: 600, color: COLORS.text, marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>Settings</div>
        <div style={{ fontSize: 14, color: COLORS.muted, marginBottom: 28 }}>Configure TERESA system parameters</div>
      </motion.div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, width: "100%", boxSizing: "border-box" }}>
        <motion.div 
          whileHover={{ y: -5, boxShadow: `0 8px 24px ${COLORS.accent}15` }}
          style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "1.5rem" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>Disposal Threshold</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: COLORS.muted }}>Trigger level</span>
            <motion.span 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5 }}
              style={{ fontSize: 13, fontWeight: 700, color: COLORS.accent }}>{threshold}%</motion.span>
          </div>
          <input type="range" min="50" max="95" value={threshold} onChange={e => setThreshold(+e.target.value)} style={{ width: "100%", accentColor: COLORS.accent, cursor: "pointer" }} />
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 8 }}>Autonomous disposal initiates at this fluid level.</div>
        </motion.div>
        <motion.div 
          whileHover={{ y: -5, boxShadow: `0 8px 24px ${COLORS.accent}15` }}
          style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "1.5rem" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>UV-C Sterilization</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: COLORS.muted }}>Duration per cycle</span>
            <motion.span 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5 }}
              style={{ fontSize: 13, fontWeight: 700, color: COLORS.warning }}>{uvDuration}s</motion.span>
          </div>
          <input type="range" min="3" max="30" value={uvDuration} onChange={e => setUvDuration(+e.target.value)} style={{ width: "100%", accentColor: COLORS.warning, cursor: "pointer" }} />
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 8 }}>Recommended: 5–10s for germicidal efficacy (260–280nm).</div>
        </motion.div>
        <motion.div 
          whileHover={{ y: -5, boxShadow: `0 8px 24px ${COLORS.accent}15` }}
          style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "1.5rem" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>Alert Channels</div>
          {Object.entries(alerts).map(([key, val]) => (
            <motion.div 
              key={key}
              whileHover={{ paddingLeft: 8 }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, transition: "all 0.2s" }}>
              <span style={{ fontSize: 13, color: COLORS.text, textTransform: "capitalize", fontWeight: 500 }}>{key === "sms" ? "SMS (GSM)" : key === "email" ? "Email" : "Push Notification"}</span>
              <motion.div 
                whileTap={{ scale: 0.9 }}
                onClick={() => setAlerts(a => ({ ...a, [key]: !val }))} 
                style={{ width: 40, height: 22, borderRadius: 11, background: val ? COLORS.accent : `${COLORS.muted}20`, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                <motion.div 
                  animate={{ left: val ? 21 : 3 }}
                  style={{ position: "absolute", top: 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }}></motion.div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
        <motion.div 
          whileHover={{ y: -5, boxShadow: `0 8px 24px ${COLORS.accent}15` }}
          style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "1.5rem" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>Hospital Details</div>
          {[["Name", "Loyola ICAM Hospital"], ["City", "Chennai, Tamil Nadu"], ["Dept", "IT & Geriatric Care"], ["TERESA Units", "5 active"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600 }}>{k}</span>
              <span style={{ fontSize: 12, color: COLORS.text, fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function TeresaDeviceIllustration({ level, stage }) {
  const getFluidColor = () => {
    if (level < 40) return COLORS.success;
    if (level < 70) return COLORS.warning;
    return COLORS.danger;
  };

  const getLiquidHeight = Math.min(level, 100);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", width: "100%" }}>
      <svg width="280" height="500" viewBox="0 0 280 500" style={{ maxWidth: "100%", maxHeight: "100%" }}>
        {/* Base/Dock with Wheels */}
        <rect x="30" y="420" width="220" height="12" rx="6" fill={COLORS.accent} opacity="0.3" />
        <motion.circle
          cx="140"
          cy="426"
          r="4"
          fill={COLORS.success}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Wheels - Animated when NAVIGATING */}
        {stage === "NAVIGATING" && (
          <>
            {/* Left Wheel */}
            <motion.circle
              cx="50"
              cy="428"
              r="5"
              fill="transparent"
              stroke={COLORS.accent}
              strokeWidth="1.5"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <circle cx="50" cy="428" r="2" fill={COLORS.accent} />
            
            {/* Right Wheel */}
            <motion.circle
              cx="230"
              cy="428"
              r="5"
              fill="transparent"
              stroke={COLORS.accent}
              strokeWidth="1.5"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <circle cx="230" cy="428" r="2" fill={COLORS.accent} />
          </>
        )}
        
        {/* Wheels - Static when not navigating */}
        {stage !== "NAVIGATING" && (
          <>
            <circle cx="50" cy="428" r="5" fill="transparent" stroke={COLORS.border} strokeWidth="1" />
            <circle cx="50" cy="428" r="2" fill={COLORS.muted} />
            <circle cx="230" cy="428" r="5" fill="transparent" stroke={COLORS.border} strokeWidth="1" />
            <circle cx="230" cy="428" r="2" fill={COLORS.muted} />
          </>
        )}

        {/* Charging Pad Outline */}
        <rect x="50" y="400" width="180" height="8" rx="4" fill="transparent" stroke={COLORS.accent} strokeWidth="1" opacity="0.5" />

        {/* Main Tank - Outer Container */}
        <g>
          <rect x="60" y="60" width="160" height="330" rx="10" fill={COLORS.surfaceAlt} stroke={COLORS.accent} strokeWidth="2" />

          {/* Tank Display/OLED Area */}
          <rect x="80" y="80" width="120" height="35" rx="4" fill={COLORS.primary} />
          <motion.text
            x="140"
            y="105"
            textAnchor="middle"
            fill={COLORS.beige}
            fontSize="16"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {Math.round(level)}%
          </motion.text>

          {/* Stage Status */}
          <motion.circle
            cx="75"
            cy="140"
            r="5"
            fill={stageColors[stage] || COLORS.muted}
            animate={{ scale: stage === "COLLECTING" || stage === "DISPOSING" || stage === "STERILIZING" ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <text x="90" y="146" fontSize="12" fill={COLORS.muted} fontFamily="'Inter', sans-serif">
            {stage}
          </text>

          {/* Liquid Container - Main Collection Tank */}
          <defs>
            <clipPath id="tankClip">
              <rect x="75" y="155" width="130" height="200" rx="6" />
            </clipPath>
          </defs>

          <rect x="75" y="155" width="130" height="200" rx="6" fill="transparent" stroke={COLORS.border} strokeWidth="1" />

          {/* Animated Liquid Level */}
          <motion.rect
            x="75"
            y={155 + (200 * (1 - getLiquidHeight / 100))}
            width="130"
            height={200 * (getLiquidHeight / 100)}
            rx="6"
            fill={getFluidColor()}
            opacity="0.6"
            animate={{ 
              y: stage === "DISPOSING" ? [155 + (200 * (1 - getLiquidHeight / 100)), 280, 155 + (200 * (1 - getLiquidHeight / 100))] : 155 + (200 * (1 - getLiquidHeight / 100))
            }}
            transition={{ 
              duration: stage === "DISPOSING" ? 2 : 0.5, 
              repeat: stage === "DISPOSING" ? Infinity : 0,
              repeatDelay: 1
            }}
            clipPath="url(#tankClip)"
          />

          {/* Collecting Animation - Droplets */}
          {stage === "COLLECTING" && (
            <>
              <motion.circle
                cx="95"
                cy="80"
                r="2.5"
                fill={COLORS.warning}
                animate={{ y: [0, 75] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.3 }}
              />
              <motion.circle
                cx="140"
                cy="80"
                r="2.5"
                fill={COLORS.warning}
                animate={{ y: [0, 75] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.1 }}
              />
              <motion.circle
                cx="185"
                cy="80"
                r="2.5"
                fill={COLORS.warning}
                animate={{ y: [0, 75] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
              />
            </>
          )}

          {/* Sterilizing Animation - UV Light Inside Tank */}
          {stage === "STERILIZING" && (
            <>
              {/* UV Light Glow Background */}
              <defs>
                <radialGradient id="uvGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#9966FF" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#9966FF" stopOpacity="0" />
                </radialGradient>
              </defs>
              
              {/* Main UV Glow Area */}
              <motion.ellipse
                cx="140"
                cy="250"
                rx="55"
                ry="80"
                fill="url(#uvGradient)"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              
              {/* UV Light Points Inside */}
              <motion.circle
                cx="110"
                cy="200"
                r="3"
                fill="#B19EFF"
                animate={{ opacity: [0.3, 1, 0.3], r: [3, 4, 3] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.circle
                cx="140"
                cy="180"
                r="3"
                fill="#B19EFF"
                animate={{ opacity: [0.3, 1, 0.3], r: [3, 4, 3] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              />
              <motion.circle
                cx="170"
                cy="200"
                r="3"
                fill="#B19EFF"
                animate={{ opacity: [0.3, 1, 0.3], r: [3, 4, 3] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
              />
              <motion.circle
                cx="140"
                cy="290"
                r="3"
                fill="#B19EFF"
                animate={{ opacity: [0.3, 1, 0.3], r: [3, 4, 3] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.9 }}
              />
            </>
          )}

          {/* Navigating/Moving Animation - Arrow */}
          {stage === "NAVIGATING" && (
            <motion.g>
              <motion.path
                d="M 100 280 L 180 280"
                stroke={COLORS.accent}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                animate={{ strokeDashoffset: [80, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                strokeDasharray="80"
              />
              <motion.polygon
                points="180,280 170,275 175,280 170,285"
                fill={COLORS.accent}
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.g>
          )}
        </g>

        {/* Status Labels */}
        <text x="140" y="35" textAnchor="middle" fontSize="13" fontWeight="600" fill={COLORS.text} fontFamily="'Inter', sans-serif">
          TERESA Device
        </text>

        {/* Level Indicator */}
        <g>
          <text x="15" y="300" fontSize="10" fill={COLORS.muted} fontFamily="'Inter', sans-serif">
            Level
          </text>
          <rect x="10" y="310" width="5" height="80" rx="2" fill={COLORS.border} />
          <motion.rect
            x="10"
            y={310 + (80 * (1 - getLiquidHeight / 100))}
            width="5"
            height={80 * (getLiquidHeight / 100)}
            rx="2"
            fill={getFluidColor()}
            animate={{ height: 80 * (getLiquidHeight / 100) }}
            transition={{ duration: 0.5 }}
          />
        </g>
      </svg>
    </div>
  );
}

function PrototypeDiagram({ level, stage }) {
  return (
    <div style={{ position: "relative", height: 550, width: "100%", borderRadius: 12, overflow: "visible", background: COLORS.bg }}>
      <TeresaDeviceIllustration level={level} stage={stage} />
    </div>
  );
}

function MonitorPage({ urineLevel, stage, batteryLevel, wifiStrength, cycleCount, logs, addLog, sosActive, setSosActive, patients, activePatient, onEmergencyActivated }) {
  const [selectedUnit, setSelectedUnit] = useState(0);
  const currentPatient = patients[selectedUnit];
  const deviceInfo = currentPatient?.prototype;
  
  // Use patient's data based on selected unit
  const patientUnitData = {
    urineLevel: [23, 45, 12, 67, 34][selectedUnit] || urineLevel,
    stage: ["COLLECTING", "NAVIGATING", "DOCKED", "COLLECTING", "STERILIZING"][selectedUnit] || stage,
    batteryLevel: deviceInfo?.battery || batteryLevel,
    wifiStrength: 85 + Math.floor(Math.random() * 15),
    cycleCount: [14, 8, 22, 5, 18][selectedUnit] || cycleCount,
  };
  
  return (
    <div style={{ padding: "2rem", fontFamily: "'Inter', sans-serif", width: "100%", maxWidth: "100%", boxSizing: "border-box", overflow: "visible" }}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}>
        <div style={{ fontSize: 28, fontWeight: 600, color: COLORS.text, marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>Real-Time Monitor - Unit Selection</div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 24 }}>Select a TERESA unit to view real-time monitoring and device visualization</div>
      </motion.div>

      {/* Unit Selector Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "1rem", marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {patients.map((patient, idx) => (
          <motion.button
            key={patient.prototype.deviceId}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedUnit(idx)}
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              border: selectedUnit === idx ? `2px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
              background: selectedUnit === idx ? `${COLORS.accent}15` : COLORS.surface,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: selectedUnit === idx ? 700 : 500,
              color: selectedUnit === idx ? COLORS.accent : COLORS.text,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              transition: "all 0.3s",
            }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>Unit {idx + 1}</div>
            <div style={{ fontSize: 10, color: selectedUnit === idx ? COLORS.accent : COLORS.muted, opacity: 0.8 }}>
              {patient.prototype.deviceId}
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Selected Unit Monitoring Details */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: COLORS.text, marginBottom: 2, fontFamily: "'Inter', sans-serif" }}>
            {deviceInfo.deviceId} - {currentPatient.name}
          </div>
          <div style={{ fontSize: 13, color: COLORS.muted }}>Patient ID: {currentPatient.id} · Ward: {currentPatient.ward}</div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <motion.div 
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ fontSize: 12, color: COLORS.muted }}>WiFi <span style={{ color: COLORS.success, fontWeight: 700 }}>{patientUnitData.wifiStrength}%</span></motion.div>
          <div style={{ fontSize: 12, color: COLORS.muted }}>Battery <span style={{ color: patientUnitData.batteryLevel < 30 ? COLORS.danger : COLORS.success, fontWeight: 700 }}>{Math.round(patientUnitData.batteryLevel)}%</span></div>
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ fontSize: 12, padding: "4px 12px", background: `${COLORS.success}15`, color: COLORS.success, borderRadius: 20, fontWeight: 600 }}>● Online</motion.div>
        </motion.div>
      </div>
      
      {/* Device Assignment Info Card */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "1.5rem", marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>Device Information</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            style={{
              padding: "14px 16px",
              borderRadius: 10,
              border: `2px solid ${COLORS.accent}`,
              background: `${COLORS.accent}12`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, marginBottom: 6 }}>Device ID</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.accent, fontFamily: "monospace" }}>{deviceInfo.deviceId}</div>
          </motion.div>
          
          <div style={{
            padding: "14px 16px",
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, marginBottom: 6 }}>Model</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{deviceInfo.model}</div>
          </div>

          <div style={{
            padding: "14px 16px",
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, marginBottom: 6 }}>Device Status</div>
            <motion.div 
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ fontSize: 14, fontWeight: 700, color: deviceInfo.status === "Active" ? COLORS.success : COLORS.warning, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: deviceInfo.status === "Active" ? COLORS.success : COLORS.warning, display: "inline-block" }}></span>
              {deviceInfo.status}
            </motion.div>
          </div>

          <div style={{
            padding: "14px 16px",
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, marginBottom: 6 }}>Battery Level</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: deviceInfo.battery < 30 ? COLORS.danger : COLORS.success }}>{deviceInfo.battery}%</div>
          </div>
        </div>
      </motion.div>
      
      <StageTimeline stage={patientUnitData.stage} />
      
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, marginTop: 20 }}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <UrineMeter level={patientUnitData.urineLevel} stage={patientUnitData.stage} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <StatCard label="Cycles Today" value={patientUnitData.cycleCount} color={COLORS.accent} />
            <StatCard label="WiFi" value={`${patientUnitData.wifiStrength}%`} color={COLORS.success} />
          </div>
          <SOSButton active={sosActive} onToggle={setSosActive} addLog={addLog} onEmergencyActivated={onEmergencyActivated} />
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <motion.div 
            whileHover={{ boxShadow: `0 8px 24px ${COLORS.accent}15` }}
            style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "2rem", flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, fontWeight: 600, width: "100%" }}>TERESA Device Visualization</div>
            <PrototypeDiagram level={patientUnitData.urineLevel} stage={patientUnitData.stage} />
          </motion.div>
          <LogPanel logs={logs} />
        </motion.div>
      </div>
    </div>
  );
}

function DashboardPage({ urineLevel, stage, batteryLevel, wifiStrength, cycleCount, patients, activePatient, setActivePatient, logs, addLog, sosActive, setSosActive, onEmergencyActivated }) {
  return (
    <div style={{ padding: "2rem", fontFamily: "'Inter', sans-serif", width: "100%", maxWidth: "100%", boxSizing: "border-box", overflow: "visible" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, maxWidth: "100%", width: "100%", boxSizing: "border-box" }}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}>
          <div style={{ fontSize: 36, fontWeight: 600, color: COLORS.text, fontFamily: "'Inter', sans-serif", textAlign: "left", marginBottom: 6 }}>Dashboard</div>
          <div style={{ fontSize: 13, color: COLORS.muted }}>ICAM Hospital · Chennai · {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {["ALL", "ICU", "GERIATRIC", "NEURO"].map(f => (
            <motion.button 
              key={f}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, border: `1px solid ${COLORS.border}`, background: f === "ALL" ? `${COLORS.accent}15` : "transparent", color: f === "ALL" ? COLORS.accent : COLORS.muted, cursor: "pointer", fontWeight: 600, fontFamily: "'Inter', sans-serif", transition: "all 0.2s" }}>{f}</motion.button>
          ))}
        </motion.div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20, width: "100%", boxSizing: "border-box" }}>
        <StatCard label="Active Patients" value={patients.length} color={COLORS.text} />
        <StatCard label="Online Units" value="5" color={COLORS.success} />
        <StatCard label="Total Cycles" value={cycleCount} color={COLORS.accent} />
        <StatCard label="Alerts Today" value="2" color={COLORS.warning} />
        <StatCard label="UTIs This Month" value="0" color={COLORS.success} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 280px", gap: 16, width: "100%", boxSizing: "border-box" }}>
        {/* Patient list */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "1rem", fontFamily: "'Inter', sans-serif", boxSizing: "border-box", overflow: "hidden" }}>
          <div style={{ fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, fontWeight: 600 }}>Patients</div>
          {patients.map((p, i) => <PatientRow key={p.id} p={p} active={i === activePatient} onClick={() => setActivePatient(i)} />)}
        </motion.div>
        {/* Center: detail + stage */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ display: "flex", flexDirection: "column", gap: 14, boxSizing: "border-box" }}>
          <PatientDetail p={patients[activePatient]} urineLevel={urineLevel} stage={stage} batteryLevel={batteryLevel} />
          <StageTimeline stage={stage} />
          <LogPanel logs={logs} />
        </motion.div>
        {/* Right: meter + SOS */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          style={{ display: "flex", flexDirection: "column", gap: 14, boxSizing: "border-box" }}>
          <UrineMeter level={urineLevel} stage={stage} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <StatCard label="Battery" value={`${Math.round(batteryLevel)}%`} color={batteryLevel < 30 ? COLORS.danger : COLORS.success} />
            <StatCard label="WiFi" value={`${wifiStrength}%`} color={COLORS.success} />
          </div>
          <SOSButton active={sosActive} onToggle={setSosActive} addLog={addLog} onEmergencyActivated={onEmergencyActivated} />

        </motion.div>
      </div>
    </div>
  );
}

function PatientsPage({ patients, activePatient, setActivePatient, urineLevel, stage, batteryLevel }) {
  return (
    <div style={{ padding: "2rem", fontFamily: "'Inter', sans-serif", width: "100%", maxWidth: "100%", overflow: "visible" }}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}>
        <div style={{ fontSize: 28, fontWeight: 600, color: COLORS.text, marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>Patient Registry</div>
        <div style={{ fontSize: 14, color: COLORS.muted, marginBottom: 28 }}>All registered patients with TERESA units assigned</div>
      </motion.div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 }}>
        {patients.map((p, i) => (
          <motion.div 
            key={p.id}
            layout={false}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -8, boxShadow: `0 16px 40px rgba(0, 0, 0, 0.12)` }}
            onClick={() => setActivePatient(i)} 
            style={{ background: `linear-gradient(135deg, ${COLORS.surface}dd 0%, ${COLORS.surfaceAlt}dd 100%)`, border: `2px solid ${i === activePatient ? COLORS.accent : "rgba(212, 165, 116, 0.1)"}`, borderRadius: 18, padding: "1.5rem", cursor: "pointer", transition: "all 0.3s", backdropFilter: "blur(8px)", scrollBehavior: "auto" }}>
            
            {/* Header: Avatar, Name, ID, Status */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
              <motion.div 
                animate={{ scale: i === activePatient ? 1.15 : 1 }}
                style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${COLORS.accent}30 0%, ${COLORS.accent}15 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, color: COLORS.accent, flexShrink: 0 }}>
                {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </motion.div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: COLORS.text, fontSize: 17, fontFamily: "'Inter', sans-serif", marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>{p.id} · <span style={{ fontWeight: 600 }}>Age {p.age}</span></div>
                <motion.div 
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, backgroundColor: `${COLORS.success}12`, color: COLORS.success, fontWeight: 700, padding: "4px 10px", borderRadius: 12 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.success }}></span>
                  Connected
                </motion.div>
              </div>
            </div>

            {/* Details Section - Clean aligned layout */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[["WARD", p.ward], ["BED", p.bed], ["DOCTOR", p.doctor], ["ADMITTED", p.admitted], ["CONDITION", p.condition]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 11, borderBottom: `1px solid rgba(212, 165, 116, 0.1)` }}>
                  <div style={{ fontSize: 10, color: COLORS.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>{k}</div>
                  <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 700, textAlign: "right", maxWidth: "55%" }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Real-time Status */}
            {i === activePatient && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 16, paddingTop: 14, borderTop: `2px solid ${COLORS.border}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: `${urineLevel > 70 ? COLORS.warning : COLORS.success}12`, borderRadius: 10, padding: "10px 12px", border: `1.5px solid ${urineLevel > 70 ? COLORS.warning : COLORS.success}25`, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: COLORS.muted, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>Level</div>
                  <div style={{ fontSize: 16, color: urineLevel > 70 ? COLORS.warning : COLORS.success, fontWeight: 800 }}>{Math.round(urineLevel)}%</div>
                </div>
                <div style={{ background: `#66666612`, borderRadius: 10, padding: "10px 12px", border: `1.5px solid #66666625`, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: COLORS.muted, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>Stage</div>
                  <div style={{ fontSize: 13, color: stageColors[stage], fontWeight: 800 }}>{stage}</div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}


export default function TeresaConnect() {
  const [page, setPage] = useState("Dashboard");
  const [showEmergencyNotif, setShowEmergencyNotif] = useState(false);
  const [emergencyTimestamp, setEmergencyTimestamp] = useState("");
  const sim = usePatientSimulations();
  const scrollContainerRef = useRef(null);

  const handleEmergencyActivated = () => {
    const now = new Date().toLocaleTimeString("en-GB");
    setEmergencyTimestamp(now);
    setShowEmergencyNotif(true);
    // Auto-hide after 5 seconds
    setTimeout(() => setShowEmergencyNotif(false), 5000);
  };

  // Reset scroll to top when page changes or on initial load
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }
  }, [page]);

  // Ensure scroll to top on mount
  useEffect(() => {
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      window.scrollTo(0, 0);
    }, 0);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", background: COLORS.bg, fontFamily: "'Inter', sans-serif", color: COLORS.text, overflow: "hidden", position: "fixed", top: 0, left: 0 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Lato:wght@300;400;500;600;700&display=swap');
        
        * { font-family: 'Inter', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Inter', sans-serif; font-weight: 600; }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        input[type="range"] {
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #E5D4C1;
          outline: none;
          -webkit-appearance: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #371931;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(55, 25, 49, 0.4);
          transition: all 0.3s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 16px rgba(55, 25, 49, 0.6);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #371931;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(55, 25, 49, 0.4);
          transition: all 0.3s ease;
        }
        
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 16px rgba(55, 25, 49, 0.6);
        }
        
        scrollbar-width: thin;
        scrollbar-color: #E5D4C1 #F8F6F3;
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #F8F6F3;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #E5D4C1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #6B3F5D;
        }
      `}</style>
      <NavBar activePage={page} setPage={setPage} />
      <div ref={scrollContainerRef} style={{ flex: 1, overflowY: "auto", overflowX: "hidden", width: "100%", boxSizing: "border-box" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} layout={false} style={{ width: "100%", boxSizing: "border-box" }}>
          {page === "Dashboard" && <DashboardPage {...sim} patients={PATIENTS} onEmergencyActivated={handleEmergencyActivated} />}
          {page === "Monitor" && <MonitorPage {...sim} patients={PATIENTS} onEmergencyActivated={handleEmergencyActivated} />}
          {page === "Patients" && <PatientsPage patients={PATIENTS} activePatient={sim.activePatient} setActivePatient={sim.setActivePatient} urineLevel={sim.urineLevel} stage={sim.stage} batteryLevel={sim.batteryLevel} />}
          {page === "Analytics" && <AnalyticsPage cycleCount={sim.cycleCount} />}
          {page === "Settings" && <SettingsPage />}
        </motion.div>
        <EmergencyNotificationToast 
          show={showEmergencyNotif} 
          message="Emergency SMS notification sent to caregiver"
          timestamp={emergencyTimestamp}
          phone="7305883459"
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ textAlign: "center", padding: "2rem", fontSize: 11, color: COLORS.muted, borderTop: `1px solid ${COLORS.border}`, marginTop: 40, fontFamily: "'Inter', sans-serif" }}>
          TERESA Connect · Loyola ICAM College of Engineering & Technology · Chennai, India · Research Prototype v2.0
        </motion.div>
      </div>
    </div>
  );
}
