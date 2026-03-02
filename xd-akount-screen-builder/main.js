// Akount Screen Builder for Adobe XD
// Programmatic UI creation using Akount design tokens

const { Rectangle, Artboard, Color, Text, Ellipse } = require("scenegraph");
const commands = require("commands");

// Akount Design System Tokens
const AKOUNT_TOKENS = {
  colors: {
    primary: "#F59E0B",      // Amber orange
    green: "#34D399",        // Income/success
    red: "#F87171",          // Expense/error
    blue: "#60A5FA",         // Transfer/info
    purple: "#A78BFA",       // AI/purple
    teal: "#2DD4BF",         // Teal accent
    background: {
      bg0: "#09090F",        // Deepest
      bg1: "#0F0F17",        // Sidebar/panels
      bg2: "#15151F",        // Elevated cards
      bg3: "#1A1A26",        // Hover states
      bg4: "#22222E",        // Active states
    },
    glass: {
      glass1: "rgba(255,255,255,0.025)",
      glass2: "rgba(255,255,255,0.04)",
      glass3: "rgba(255,255,255,0.06)",
    },
    border: {
      border1: "rgba(255,255,255,0.06)",
      border2: "rgba(255,255,255,0.09)",
      border3: "rgba(255,255,255,0.13)",
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
};

// Utility: Create Color from hex
function hexToColor(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return new Color("#FFFFFF");
  }
  return new Color(hex);
}

// Utility: Create Color from rgba string
function rgbaToColor(rgba) {
  // Parse rgba(r,g,b,a) format
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) {
    return new Color("#FFFFFF", 1);
  }
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  const a = match[4] ? parseFloat(match[4]) * 255 : 255;

  // XD Color expects 0-255 for all channels including alpha
  return new Color(`rgba(${r}, ${g}, ${b}, ${a})`);
}

// Create a 100px blue square
function createBlueSquare(selection) {
  const square = new Rectangle();
  square.width = 100;
  square.height = 100;
  square.fill = hexToColor("#0000FF");

  selection.insertionParent.addChild(square);
  square.moveInParentCoordinates(100, 100);

  return square;
}

// Create a glass card
function createGlassCard(selection, width, height, x, y, variant = "glass1") {
  const card = new Rectangle();
  card.width = width;
  card.height = height;

  // Glass background with opacity
  const glassColor = AKOUNT_TOKENS.colors.glass[variant];
  card.fill = rgbaToColor(glassColor);

  // Border
  const borderColor = rgbaToColor(AKOUNT_TOKENS.colors.border.border1);
  card.stroke = borderColor;
  card.strokeWidth = 1;

  // Border radius
  card.setAllCornerRadii(AKOUNT_TOKENS.borderRadius.xl);

  selection.insertionParent.addChild(card);
  card.moveInParentCoordinates(x, y);

  return card;
}

// Create text node
function createTextNode(selection, text, fontSize, color, x, y) {
  const textNode = new Text();
  textNode.text = text;
  textNode.fontSize = fontSize;
  textNode.fill = hexToColor(color);

  selection.insertionParent.addChild(textNode);
  textNode.moveInParentCoordinates(x, y);

  return textNode;
}

// Create stat card
function createStatCard(selection, label, value, trend, trendPositive, x, y) {
  const cardWidth = 280;
  const cardHeight = 120;

  // Background card
  const card = createGlassCard(selection, cardWidth, cardHeight, x, y, "glass1");

  // Label text
  const labelText = createTextNode(
    selection,
    label.toUpperCase(),
    11,
    "#71717A",
    x + AKOUNT_TOKENS.spacing.lg,
    y + AKOUNT_TOKENS.spacing.lg
  );

  // Value text
  const valueText = createTextNode(
    selection,
    value,
    32,
    "#FFFFFF",
    x + AKOUNT_TOKENS.spacing.lg,
    y + AKOUNT_TOKENS.spacing.lg + 30
  );

  // Trend text
  const trendColor = trendPositive ? AKOUNT_TOKENS.colors.green : AKOUNT_TOKENS.colors.red;
  const trendText = createTextNode(
    selection,
    trend,
    11,
    trendColor,
    x + AKOUNT_TOKENS.spacing.lg,
    y + AKOUNT_TOKENS.spacing.lg + 70
  );

  return { card, labelText, valueText, trendText };
}

// Build complete dashboard
function buildDashboard(selection) {
  // Create artboard
  const artboard = new Artboard();
  artboard.width = 1440;
  artboard.height = 900;
  artboard.fill = hexToColor(AKOUNT_TOKENS.colors.background.bg0);

  selection.insertionParent.addChild(artboard);
  artboard.moveInParentCoordinates(0, 0);

  // Update selection to artboard
  selection.items = [artboard];

  // Title
  const title = createTextNode(selection, "Dashboard", 32, "#FFFFFF", 40, 40);

  // Stat cards
  const stats = [
    { label: "Total Revenue", value: "$48,392", trend: "+12.3%", positive: true },
    { label: "Expenses", value: "$23,104", trend: "+5.2%", positive: false },
    { label: "Net Income", value: "$25,288", trend: "+18.1%", positive: true },
  ];

  let cardX = 40;
  const cardY = 120;

  stats.forEach((stat) => {
    createStatCard(
      selection,
      stat.label,
      stat.value,
      stat.trend,
      stat.positive,
      cardX,
      cardY
    );
    cardX += 280 + AKOUNT_TOKENS.spacing.lg;
  });

  return artboard;
}

// Panel UI
function create() {
  const html = `
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0F0F17;
    color: #FFFFFF;
    padding: 20px;
  }
  h1 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #F59E0B;
  }
  p {
    font-size: 12px;
    color: #71717A;
    margin-bottom: 20px;
    line-height: 1.5;
  }
  .section {
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
  }
  .section h2 {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 10px;
    color: #FFFFFF;
  }
  button {
    width: 100%;
    padding: 12px;
    font-size: 13px;
    font-weight: 500;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    margin-bottom: 8px;
    font-family: inherit;
  }
  .btn-primary {
    background: #F59E0B;
    color: #000000;
  }
  .btn-secondary {
    background: rgba(245, 158, 11, 0.14);
    color: #FFB02E;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }
  input {
    width: 100%;
    padding: 10px;
    font-size: 13px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 6px;
    color: #FFFFFF;
    margin-bottom: 8px;
    font-family: inherit;
  }
  label {
    display: block;
    font-size: 11px;
    color: #A1A1AA;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>

<h1>🎨 Akount Screen Builder</h1>
<p>Build UI screens programmatically for Akount</p>

<div class="section">
  <h2>Quick Actions</h2>
  <button class="btn-primary" id="btnBlueSquare">Create 100px Blue Square</button>
  <button class="btn-secondary" id="btnDashboard">Build Dashboard Screen</button>
</div>

<div class="section">
  <h2>Stat Card Builder</h2>
  <label>Label</label>
  <input type="text" id="statLabel" value="Total Revenue" />

  <label>Value</label>
  <input type="text" id="statValue" value="$48,392" />

  <label>Trend</label>
  <input type="text" id="statTrend" value="+12.3%" />

  <label>
    <input type="checkbox" id="statPositive" checked /> Positive (green)
  </label>

  <button class="btn-secondary" id="btnStatCard">Create Stat Card</button>
</div>
`;

  const panel = document.createElement("panel");
  panel.innerHTML = html;

  // Event handlers
  panel.querySelector("#btnBlueSquare").addEventListener("click", () => {
    createBlueSquare(require("scenegraph").selection);
  });

  panel.querySelector("#btnDashboard").addEventListener("click", () => {
    buildDashboard(require("scenegraph").selection);
  });

  panel.querySelector("#btnStatCard").addEventListener("click", () => {
    const label = panel.querySelector("#statLabel").value;
    const value = panel.querySelector("#statValue").value;
    const trend = panel.querySelector("#statTrend").value;
    const positive = panel.querySelector("#statPositive").checked;

    createStatCard(
      require("scenegraph").selection,
      label,
      value,
      trend,
      positive,
      100,
      100
    );
  });

  return panel;
}

module.exports = {
  panels: {
    akountBuilder: {
      create
    }
  }
};
