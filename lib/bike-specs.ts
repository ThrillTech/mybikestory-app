export const CATEGORIES: Record<string, string[]> = {
  "BMX": ["BMX Freestyle", "BMX Race"],
  "Commuter & Urban": ["City / Hybrid", "Commuter", "Folding"],
  "E-Bikes": ["E-Commuter", "E-MTB", "E-Road"],
  "Gravel Bikes": ["Cyclocross", "Gravel / Adventure"],
  "Kids Bikes": ["Balance Bike", "Kids MTB", "Kids Road"],
  "Mountain Bikes": ["Dirt Jump", "Downhill", "Dual Suspension", "Hardtail", "Single Speed"],
  "Road Bikes": ["Aero", "Endurance", "Race", "Single Speed / Fixed", "Touring"],
  "Triathlon & Time Trial": ["Time Trial", "Triathlon"],
};

export const FRAME_SIZES = ["XS", "S", "S/M", "M", "M/L", "L", "XL", "XXL", "Custom", "Not sure"];

// Wheel sizes largest to smallest
export const WHEEL_SIZES = ["32\"", "29\"", "27.5+ (Plus)", "27.5\"", "26\"", "700c", "650b", "24\"", "20\"", "16\"", "Not sure"];

export const FRAME_MATERIALS = ["Aluminium", "Carbon", "Chromoly", "Steel", "Titanium", "Not sure"];

export const GROUPSET_BRANDS = ["Campagnolo", "microSHIFT", "Shimano", "SRAM", "Other", "Not sure"];

export const SHIMANO_LEVELS = ["Acera", "Alivio", "Altus", "Claris", "Deore", "Dura-Ace", "GRX", "Sora", "SLX", "Tiagra", "Tourney", "Ultegra", "XT", "XTR", "105", "Other"];
export const SRAM_LEVELS = ["Apex", "Force", "GX Eagle", "NX Eagle", "Red", "Rival", "SX Eagle", "X01 Eagle", "XX Eagle", "Other"];
export const CAMPAGNOLO_LEVELS = ["Centaur", "Chorus", "Potenza", "Record", "Super Record", "Veloce", "Other"];

export const FORK_BRANDS = ["DVO", "Fox", "Lauf", "Manitou", "Marzocchi", "MRP", "Ohlins", "RockShox", "SR Suntour", "X-Fusion", "Rigid (no suspension)", "Other", "Not sure"];

export const SHOCK_BRANDS = ["Cane Creek", "DVO", "Fox", "Manitou", "Ohlins", "RockShox", "X-Fusion", "N/A (Hardtail)", "Other", "Not sure"];

export const MODEL_YEARS = ["Not sure", ...Array.from({ length: 16 }, (_, i) => String(2025 - i))];
