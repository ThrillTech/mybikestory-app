export const CATEGORIES: Record<string, string[]> = {
  "Mountain Bikes": ["Hardtail", "Dual Suspension", "Downhill", "Dirt Jump", "Single Speed"],
  "Road Bikes": ["Race", "Endurance", "Aero", "Touring", "Single Speed / Fixed"],
  "Gravel Bikes": ["Gravel / Adventure", "Cyclocross"],
  "Triathlon & Time Trial": ["Triathlon", "Time Trial"],
  "Commuter & Urban": ["Commuter", "City / Hybrid", "Folding"],
  "Kids Bikes": ["Kids MTB", "Kids Road", "Balance Bike"],
  "E-Bikes": ["E-MTB", "E-Road", "E-Commuter"],
  "BMX": ["BMX Race", "BMX Freestyle"],
};

export const FRAME_SIZES = ["XS", "S", "S/M", "M", "M/L", "L", "XL", "XXL", "Custom", "Not sure"];

export const WHEEL_SIZES = ["26\"", "27.5\"", "27.5+ (Plus)", "29\"", "700c", "650b", "24\"", "20\"", "16\"", "Not sure"];

export const FRAME_MATERIALS = ["Carbon", "Aluminium", "Steel", "Titanium", "Chromoly", "Not sure"];

export const GROUPSET_BRANDS = ["Shimano", "SRAM", "Campagnolo", "microSHIFT", "Other", "Not sure"];

export const SHIMANO_LEVELS = ["Dura-Ace", "Ultegra", "105", "Tiagra", "Sora", "Claris", "XTR", "XT", "SLX", "Deore", "Alivio", "Altus", "Acera", "Tourney", "GRX", "Other"];
export const SRAM_LEVELS = ["Red", "Force", "Rival", "Apex", "XX Eagle", "X01 Eagle", "GX Eagle", "NX Eagle", "SX Eagle", "Other"];
export const CAMPAGNOLO_LEVELS = ["Super Record", "Record", "Chorus", "Potenza", "Centaur", "Veloce", "Other"];

export const FORK_BRANDS = ["Fox", "RockShox", "Manitou", "Marzocchi", "DVO", "MRP", "X-Fusion", "SR Suntour", "Ohlins", "Rigid (no suspension)", "Other", "Not sure"];

export const SHOCK_BRANDS = ["Fox", "RockShox", "Ohlins", "Manitou", "X-Fusion", "DVO", "N/A (Hardtail)", "Other", "Not sure"];

export const MODEL_YEARS = ["Not sure", ...Array.from({ length: 16 }, (_, i) => String(2025 - i))];
