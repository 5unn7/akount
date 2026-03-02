# 🎨 Akount Screen Builder for Adobe XD

Programmatically build Akount UI screens using design system tokens directly in Adobe XD.

## Features

- ✅ **Design System Integration** - All Akount colors, spacing, typography built-in
- ✅ **Programmatic Creation** - Create screens with code, not manual drawing
- ✅ **Component Library** - Glass cards, stat cards, buttons with proper tokens
- ✅ **Dashboard Builder** - Build complete screens with one click
- ✅ **Customizable** - Edit component properties via plugin panel

## What This Plugin Can Do

### 1. Quick Actions
- **Create 100px Blue Square** - Test shape creation
- **Build Dashboard Screen** - Complete 1440×900 dashboard with stats

### 2. Component Builder
- **Stat Cards** - Labels, values, trends with proper colors
- **Glass Cards** - Morphism effects with borders
- **Text Elements** - Akount typography system

### 3. Design Tokens Built-In

All Akount design system tokens are pre-configured:

**Colors:**
- Primary: `#F59E0B` (Amber Orange)
- Green: `#34D399` (Income/Success)
- Red: `#F87171` (Expense/Error)
- Blue: `#60A5FA` (Transfer/Info)
- Purple: `#A78BFA` (AI/Purple)

**Backgrounds:**
- bg0-bg4: Dark purple-tinted hierarchy

**Spacing:**
- xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px

**Border Radius:**
- sm: 4px | md: 8px | lg: 12px | xl: 16px

## Installation

### Step 1: Locate XD Plugin Folder

**Windows:**
```
C:\Users\[YourUsername]\AppData\Local\Packages\Adobe.CC.XD_[random]\LocalState\develop
```

**macOS:**
```
~/Library/Application Support/Adobe/Adobe XD/develop
```

### Step 2: Copy Plugin Files

1. Copy the entire `xd-akount-screen-builder` folder to the `develop` directory
2. Restart Adobe XD (if it's running)

### Step 3: Enable Plugin

1. Open Adobe XD
2. Go to **Plugins → Development → Reload Plugins**
3. The plugin should appear in **Plugins → Akount Screen Builder**

## Usage

### Open the Plugin Panel

1. In Adobe XD, go to **Plugins → Akount Screen Builder**
2. The panel will appear on the right side

### Create a Blue Square (Test)

1. Click **"Create 100px Blue Square"**
2. A perfect 100×100px blue rectangle appears on canvas

### Build a Dashboard Screen

1. Click **"Build Dashboard Screen"**
2. A complete 1440×900 artboard is created with:
   - Dark background (bg0)
   - Title "Dashboard"
   - 3 stat cards (Revenue, Expenses, Net Income)
   - Proper spacing using design tokens

### Create Custom Stat Cards

1. Enter **Label** (e.g., "Monthly Revenue")
2. Enter **Value** (e.g., "$125,400")
3. Enter **Trend** (e.g., "+15.2%")
4. Check/uncheck **Positive** (green vs red)
5. Click **"Create Stat Card"**

## File Structure

```
xd-akount-screen-builder/
├── manifest.json    # Plugin metadata
├── main.js          # Main plugin logic (JavaScript)
└── README.md        # This file
```

## Extending the Plugin

### Add New Components

Edit `main.js` and create new functions:

```javascript
function createMyComponent(selection, x, y) {
  const component = new Rectangle();
  component.width = 200;
  component.height = 100;
  component.fill = hexToColor(AKOUNT_TOKENS.colors.primary);

  selection.insertionParent.addChild(component);
  component.moveInParentCoordinates(x, y);

  return component;
}
```

### Add New Screens

Create screen builder functions like `buildDashboard()`:

```javascript
function buildInvoiceScreen(selection) {
  const artboard = new Artboard();
  artboard.width = 1440;
  artboard.height = 900;
  // ... build your screen layout
  return artboard;
}
```

### Update UI

Add new buttons in the HTML section of `create()`:

```html
<button class="btn-secondary" id="btnInvoice">Build Invoice Screen</button>
```

Then add the event handler:

```javascript
panel.querySelector("#btnInvoice").addEventListener("click", () => {
  buildInvoiceScreen(require("scenegraph").selection);
});
```

## XD Plugin API Reference

This plugin uses:
- **scenegraph** - Rectangle, Artboard, Text, Color
- **commands** - XD commands
- **Selection** - insertionParent, items

Full API docs: [Adobe XD Plugin Reference](https://adobexdplatform.com/plugin-docs/)

## Troubleshooting

### Plugin not appearing

**Solution:**
1. Make sure the folder is in the correct `develop` directory
2. Restart Adobe XD completely
3. Go to **Plugins → Development → Reload Plugins**

### Errors when creating shapes

**Solution:**
1. Make sure you have an artboard selected or create one first
2. Check the XD console (**Plugins → Development → Developer Console**)

### Changes not reflecting

**Solution:**
1. Save your `main.js` file
2. In XD: **Plugins → Development → Reload Plugins**

## Development Workflow

1. Edit `main.js`
2. Save file
3. In XD: **Plugins → Development → Reload Plugins**
4. Test your changes

## Design System Reference

This plugin implements the **Akount Financial Clarity** design system:

- **Dark-first** aesthetic with purple-tinted blacks
- **Glass morphism** with subtle borders
- **Semantic colors** for financial data
- **Typography hierarchy** (proper font sizes)
- **Consistent spacing** using 8px grid

## Future Enhancements

- [ ] More screen templates (Banking, Invoices, Reports)
- [ ] Button component variants
- [ ] Form field components
- [ ] Navigation components
- [ ] Export to React components

## Important Notes

- **Adobe XD Plugin Marketplace** stopped accepting new plugins as of Nov 15, 2024
- This is a development plugin for internal use
- Can still be distributed privately within your team

## License

MIT

## Author

Built for the Akount project using Adobe XD Plugin API.

---

**Sources:**
- [Adobe XD Plugin API](https://developer.adobe.com/xd/)
- [XD Plugin Reference](https://adobexdplatform.com/plugin-docs/)
- [XD Plugin Samples](https://github.com/AdobeXD/plugin-samples)
