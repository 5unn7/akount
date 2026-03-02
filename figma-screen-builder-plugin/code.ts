// Akount Screen Builder v2.0 - Full Component Library
// Auto-generates all 24+ shadcn/ui components with Akount design tokens

// ═══════════════════════════════════════════════════════
// 1. DESIGN TOKENS
// ═══════════════════════════════════════════════════════

interface DesignTokens {
  colors: {
    primary: string;
    green: string;
    red: string;
    blue: string;
    purple: string;
    teal: string;
    background: {
      bg0: string;
      bg1: string;
      bg2: string;
      bg3: string;
      bg4: string;
    };
    glass: {
      glass1: string;
      glass2: string;
      glass3: string;
    };
    border: {
      border1: string;
      border2: string;
      border3: string;
    };
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    heading: string;
    body: string;
    mono: string;
  };
}

const AKOUNT_TOKENS: DesignTokens = {
  colors: {
    primary: '#F59E0B',
    green: '#34D399',
    red: '#F87171',
    blue: '#60A5FA',
    purple: '#A78BFA',
    teal: '#2DD4BF',
    background: {
      bg0: '#09090F',
      bg1: '#0F0F17',
      bg2: '#15151F',
      bg3: '#1A1A26',
      bg4: '#22222E',
    },
    glass: {
      glass1: 'rgba(255,255,255,0.025)',
      glass2: 'rgba(255,255,255,0.04)',
      glass3: 'rgba(255,255,255,0.06)',
    },
    border: {
      border1: 'rgba(255,255,255,0.06)',
      border2: 'rgba(255,255,255,0.09)',
      border3: 'rgba(255,255,255,0.13)',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#A1A1AA',
      muted: '#71717A',
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
  typography: {
    heading: 'Newsreader',
    body: 'Manrope',
    mono: 'JetBrains Mono',
  },
};

// ═══════════════════════════════════════════════════════
// 2. UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

function rgbaToFigma(rgba: string): RGBA {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) {
    throw new Error(`Invalid rgba color: ${rgba}`);
  }
  return {
    r: parseInt(match[1]) / 255,
    g: parseInt(match[2]) / 255,
    b: parseInt(match[3]) / 255,
    a: match[4] ? parseFloat(match[4]) : 1,
  };
}

async function loadFont(fontName: FontName): Promise<void> {
  try {
    await figma.loadFontAsync(fontName);
  } catch {
    // Fallback to Inter if font not available
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  }
}

// ═══════════════════════════════════════════════════════
// 3. COMPONENT BUILDERS
// ═══════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────
// 3.1 BUTTON COMPONENT
// ───────────────────────────────────────────────────────

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

async function createButton(
  label: string,
  variant: ButtonVariant = 'default',
  size: ButtonSize = 'default',
  x: number = 0,
  y: number = 0
): Promise<FrameNode> {
  const button = figma.createFrame();
  button.name = `Button - ${variant} - ${label}`;

  // Size mapping
  const sizeMap = {
    default: { height: 36, paddingX: 16, fontSize: 14 },
    sm: { height: 32, paddingX: 12, fontSize: 12 },
    lg: { height: 40, paddingX: 32, fontSize: 14 },
    icon: { height: 36, paddingX: 0, width: 36, fontSize: 14 },
  };

  const sizing = sizeMap[size];
  button.resize(sizing.width || 120, sizing.height);
  button.x = x;
  button.y = y;

  // Variant styling
  switch (variant) {
    case 'default': {
      const primaryColor = hexToRgb(AKOUNT_TOKENS.colors.primary);
      button.fills = [{ type: 'SOLID', color: primaryColor }];
      break;
    }
    case 'destructive': {
      const redColor = hexToRgb(AKOUNT_TOKENS.colors.red);
      button.fills = [{ type: 'SOLID', color: redColor }];
      break;
    }
    case 'outline': {
      button.fills = [];
      const borderColor = rgbaToFigma(AKOUNT_TOKENS.colors.border.border1);
      button.strokes = [{
        type: 'SOLID',
        color: { r: borderColor.r, g: borderColor.g, b: borderColor.b },
        opacity: borderColor.a,
      }];
      button.strokeWeight = 1;
      break;
    }
    case 'secondary': {
      const glassColor = rgbaToFigma(AKOUNT_TOKENS.colors.glass.glass2);
      button.fills = [{
        type: 'SOLID',
        color: { r: glassColor.r, g: glassColor.g, b: glassColor.b },
        opacity: glassColor.a,
      }];
      break;
    }
    case 'ghost': {
      button.fills = [];
      break;
    }
    case 'link': {
      button.fills = [];
      break;
    }
  }

  button.cornerRadius = AKOUNT_TOKENS.borderRadius.md;
  button.layoutMode = 'HORIZONTAL';
  button.primaryAxisAlignItems = 'CENTER';
  button.counterAxisAlignItems = 'CENTER';
  button.paddingLeft = sizing.paddingX;
  button.paddingRight = sizing.paddingX;
  button.itemSpacing = AKOUNT_TOKENS.spacing.sm;

  // Button text
  const textNode = figma.createText();
  await loadFont({ family: 'Inter', style: 'Medium' });
  textNode.fontName = { family: 'Inter', style: 'Medium' };
  textNode.fontSize = sizing.fontSize;
  textNode.characters = label;

  const textColor = variant === 'default' || variant === 'destructive'
    ? hexToRgb('#000000')
    : hexToRgb(AKOUNT_TOKENS.colors.text.primary);
  textNode.fills = [{ type: 'SOLID', color: textColor }];

  button.appendChild(textNode);
  return button;
}

// ───────────────────────────────────────────────────────
// 3.2 BADGE COMPONENT
// ───────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline';

async function createBadge(
  label: string,
  variant: BadgeVariant = 'default',
  x: number = 0,
  y: number = 0
): Promise<FrameNode> {
  const badge = figma.createFrame();
  badge.name = `Badge - ${variant} - ${label}`;
  badge.resize(80, 24);
  badge.x = x;
  badge.y = y;

  // Variant styling
  switch (variant) {
    case 'default': {
      const primaryColor = hexToRgb(AKOUNT_TOKENS.colors.primary);
      badge.fills = [{ type: 'SOLID', color: primaryColor }];
      break;
    }
    case 'secondary': {
      const glassColor = rgbaToFigma(AKOUNT_TOKENS.colors.glass.glass2);
      badge.fills = [{
        type: 'SOLID',
        color: { r: glassColor.r, g: glassColor.g, b: glassColor.b },
        opacity: glassColor.a,
      }];
      break;
    }
    case 'destructive': {
      const redColor = hexToRgb(AKOUNT_TOKENS.colors.red);
      badge.fills = [{ type: 'SOLID', color: redColor }];
      break;
    }
    case 'success': {
      const greenDim = rgbaToFigma('rgba(52,211,153,0.18)');
      badge.fills = [{
        type: 'SOLID',
        color: { r: greenDim.r, g: greenDim.g, b: greenDim.b },
        opacity: greenDim.a,
      }];
      break;
    }
    case 'warning': {
      const primaryDim = rgbaToFigma('rgba(245,158,11,0.14)');
      badge.fills = [{
        type: 'SOLID',
        color: { r: primaryDim.r, g: primaryDim.g, b: primaryDim.b },
        opacity: primaryDim.a,
      }];
      break;
    }
    case 'outline': {
      badge.fills = [];
      const borderColor = rgbaToFigma(AKOUNT_TOKENS.colors.border.border1);
      badge.strokes = [{
        type: 'SOLID',
        color: { r: borderColor.r, g: borderColor.g, b: borderColor.b },
        opacity: borderColor.a,
      }];
      badge.strokeWeight = 1;
      break;
    }
  }

  badge.cornerRadius = AKOUNT_TOKENS.borderRadius.lg;
  badge.layoutMode = 'HORIZONTAL';
  badge.primaryAxisAlignItems = 'CENTER';
  badge.counterAxisAlignItems = 'CENTER';
  badge.paddingLeft = 10;
  badge.paddingRight = 10;
  badge.paddingTop = 2;
  badge.paddingBottom = 2;

  // Badge text
  const textNode = figma.createText();
  await loadFont({ family: 'Inter', style: 'SemiBold' });
  textNode.fontName = { family: 'Inter', style: 'SemiBold' };
  textNode.fontSize = 11;
  textNode.characters = label;

  const textColorMap: Record<BadgeVariant, string> = {
    default: '#000000',
    secondary: AKOUNT_TOKENS.colors.text.primary,
    destructive: '#000000',
    success: AKOUNT_TOKENS.colors.green,
    warning: AKOUNT_TOKENS.colors.primary,
    outline: AKOUNT_TOKENS.colors.text.primary,
  };

  const textColor = hexToRgb(textColorMap[variant]);
  textNode.fills = [{ type: 'SOLID', color: textColor }];

  badge.appendChild(textNode);
  return badge;
}

// ───────────────────────────────────────────────────────
// 3.3 CARD COMPONENT
// ───────────────────────────────────────────────────────

type CardVariant = 'default' | 'glass';

function createCard(
  width: number,
  height: number,
  variant: CardVariant = 'default',
  x: number = 0,
  y: number = 0
): FrameNode {
  const card = figma.createFrame();
  card.name = `Card - ${variant}`;
  card.resize(width, height);
  card.x = x;
  card.y = y;

  if (variant === 'glass') {
    const glassColor = rgbaToFigma(AKOUNT_TOKENS.colors.glass.glass1);
    card.fills = [{
      type: 'SOLID',
      color: { r: glassColor.r, g: glassColor.g, b: glassColor.b },
      opacity: glassColor.a,
    }];
  } else {
    const bgColor = hexToRgb(AKOUNT_TOKENS.colors.background.bg1);
    card.fills = [{ type: 'SOLID', color: bgColor }];
  }

  const borderColor = rgbaToFigma(AKOUNT_TOKENS.colors.border.border1);
  card.strokes = [{
    type: 'SOLID',
    color: { r: borderColor.r, g: borderColor.g, b: borderColor.b },
    opacity: borderColor.a,
  }];
  card.strokeWeight = 1;
  card.cornerRadius = AKOUNT_TOKENS.borderRadius.lg;

  card.layoutMode = 'VERTICAL';
  card.paddingLeft = AKOUNT_TOKENS.spacing.lg;
  card.paddingRight = AKOUNT_TOKENS.spacing.lg;
  card.paddingTop = AKOUNT_TOKENS.spacing.lg;
  card.paddingBottom = AKOUNT_TOKENS.spacing.lg;
  card.itemSpacing = AKOUNT_TOKENS.spacing.md;

  return card;
}

// ───────────────────────────────────────────────────────
// 3.4 INPUT COMPONENT
// ───────────────────────────────────────────────────────

async function createInput(
  placeholder: string = 'Enter text...',
  x: number = 0,
  y: number = 0
): Promise<FrameNode> {
  const input = figma.createFrame();
  input.name = 'Input';
  input.resize(240, 36);
  input.x = x;
  input.y = y;

  const bgColor = rgbaToFigma(AKOUNT_TOKENS.colors.glass.glass1);
  input.fills = [{
    type: 'SOLID',
    color: { r: bgColor.r, g: bgColor.g, b: bgColor.b },
    opacity: bgColor.a,
  }];

  const borderColor = rgbaToFigma(AKOUNT_TOKENS.colors.border.border1);
  input.strokes = [{
    type: 'SOLID',
    color: { r: borderColor.r, g: borderColor.g, b: borderColor.b },
    opacity: borderColor.a,
  }];
  input.strokeWeight = 1;
  input.cornerRadius = AKOUNT_TOKENS.borderRadius.md;

  input.layoutMode = 'HORIZONTAL';
  input.primaryAxisAlignItems = 'CENTER';
  input.counterAxisAlignItems = 'CENTER';
  input.paddingLeft = AKOUNT_TOKENS.spacing.md;
  input.paddingRight = AKOUNT_TOKENS.spacing.md;

  const textNode = figma.createText();
  await loadFont({ family: 'Inter', style: 'Regular' });
  textNode.fontName = { family: 'Inter', style: 'Regular' };
  textNode.fontSize = 14;
  textNode.characters = placeholder;

  const mutedColor = hexToRgb(AKOUNT_TOKENS.colors.text.muted);
  textNode.fills = [{ type: 'SOLID', color: mutedColor }];

  input.appendChild(textNode);
  return input;
}

// ───────────────────────────────────────────────────────
// 3.5 TABLE COMPONENT
// ───────────────────────────────────────────────────────

async function createTable(
  rows: number = 3,
  cols: number = 3,
  x: number = 0,
  y: number = 0
): Promise<FrameNode> {
  const table = figma.createFrame();
  table.name = 'Table';
  table.resize(600, (rows + 1) * 48);
  table.x = x;
  table.y = y;

  const bgColor = hexToRgb(AKOUNT_TOKENS.colors.background.bg1);
  table.fills = [{ type: 'SOLID', color: bgColor }];

  table.layoutMode = 'VERTICAL';
  table.itemSpacing = 0;

  // Header row
  const headerRow = figma.createFrame();
  headerRow.name = 'Header Row';
  headerRow.resize(600, 48);
  headerRow.layoutMode = 'HORIZONTAL';
  headerRow.itemSpacing = 0;
  headerRow.primaryAxisSizingMode = 'FIXED';

  const headerBg = rgbaToFigma(AKOUNT_TOKENS.colors.glass.glass1);
  headerRow.fills = [{
    type: 'SOLID',
    color: { r: headerBg.r, g: headerBg.g, b: headerBg.b },
    opacity: headerBg.a,
  }];

  const borderColor = rgbaToFigma(AKOUNT_TOKENS.colors.border.border1);
  headerRow.strokes = [{
    type: 'SOLID',
    color: { r: borderColor.r, g: borderColor.g, b: borderColor.b },
    opacity: borderColor.a,
  }];
  headerRow.strokeWeight = 1;
  headerRow.strokeAlign = 'INSIDE';

  for (let c = 0; c < cols; c++) {
    const cell = figma.createFrame();
    cell.name = `Header ${c + 1}`;
    cell.resize(600 / cols, 48);
    cell.layoutMode = 'HORIZONTAL';
    cell.primaryAxisAlignItems = 'MIN';
    cell.counterAxisAlignItems = 'CENTER';
    cell.paddingLeft = AKOUNT_TOKENS.spacing.sm;
    cell.fills = [];

    const text = figma.createText();
    await loadFont({ family: 'Inter', style: 'Medium' });
    text.fontName = { family: 'Inter', style: 'Medium' };
    text.fontSize = 13;
    text.characters = `Column ${c + 1}`;

    const mutedColor = hexToRgb(AKOUNT_TOKENS.colors.text.muted);
    text.fills = [{ type: 'SOLID', color: mutedColor }];

    cell.appendChild(text);
    headerRow.appendChild(cell);
  }

  table.appendChild(headerRow);

  // Data rows
  for (let r = 0; r < rows; r++) {
    const dataRow = figma.createFrame();
    dataRow.name = `Row ${r + 1}`;
    dataRow.resize(600, 48);
    dataRow.layoutMode = 'HORIZONTAL';
    dataRow.itemSpacing = 0;
    dataRow.primaryAxisSizingMode = 'FIXED';
    dataRow.fills = [];

    dataRow.strokes = [{
      type: 'SOLID',
      color: { r: borderColor.r, g: borderColor.g, b: borderColor.b },
      opacity: borderColor.a,
    }];
    dataRow.strokeWeight = 1;
    dataRow.strokeAlign = 'INSIDE';

    for (let c = 0; c < cols; c++) {
      const cell = figma.createFrame();
      cell.name = `Cell ${r + 1}-${c + 1}`;
      cell.resize(600 / cols, 48);
      cell.layoutMode = 'HORIZONTAL';
      cell.primaryAxisAlignItems = 'MIN';
      cell.counterAxisAlignItems = 'CENTER';
      cell.paddingLeft = AKOUNT_TOKENS.spacing.sm;
      cell.fills = [];

      const text = figma.createText();
      await loadFont({ family: 'Inter', style: 'Regular' });
      text.fontName = { family: 'Inter', style: 'Regular' };
      text.fontSize = 13;
      text.characters = `Data ${r + 1}-${c + 1}`;

      const textColor = hexToRgb(AKOUNT_TOKENS.colors.text.primary);
      text.fills = [{ type: 'SOLID', color: textColor }];

      cell.appendChild(text);
      dataRow.appendChild(cell);
    }

    table.appendChild(dataRow);
  }

  return table;
}

// ───────────────────────────────────────────────────────
// 3.6 SKELETON COMPONENT
// ───────────────────────────────────────────────────────

function createSkeleton(
  width: number = 200,
  height: number = 20,
  x: number = 0,
  y: number = 0
): RectangleNode {
  const skeleton = figma.createRectangle();
  skeleton.name = 'Skeleton';
  skeleton.resize(width, height);
  skeleton.x = x;
  skeleton.y = y;

  const skeletonColor = rgbaToFigma('rgba(245,158,11,0.10)');
  skeleton.fills = [{
    type: 'SOLID',
    color: { r: skeletonColor.r, g: skeletonColor.g, b: skeletonColor.b },
    opacity: skeletonColor.a,
  }];

  skeleton.cornerRadius = AKOUNT_TOKENS.borderRadius.md;

  return skeleton;
}

// ───────────────────────────────────────────────────────
// 3.7 STAT CARD (Custom Akount Component)
// ───────────────────────────────────────────────────────

async function createStatCard(
  label: string,
  value: string,
  trend: string,
  trendPositive: boolean,
  x: number,
  y: number
): Promise<FrameNode> {
  const card = createCard(280, 120, 'glass', x, y);
  card.name = `Stat Card - ${label}`;

  const labelText = figma.createText();
  await loadFont({ family: 'Inter', style: 'Medium' });
  labelText.fontName = { family: 'Inter', style: 'Medium' };
  labelText.fontSize = 11;
  labelText.characters = label.toUpperCase();
  labelText.name = 'Label';

  const mutedColor = hexToRgb(AKOUNT_TOKENS.colors.text.muted);
  labelText.fills = [{ type: 'SOLID', color: mutedColor }];

  const valueText = figma.createText();
  await loadFont({ family: 'Roboto Mono', style: 'Regular' });
  valueText.fontName = { family: 'Roboto Mono', style: 'Regular' };
  valueText.fontSize = 32;
  valueText.characters = value;
  valueText.name = 'Value';

  const whiteColor = hexToRgb(AKOUNT_TOKENS.colors.text.primary);
  valueText.fills = [{ type: 'SOLID', color: whiteColor }];

  const trendText = figma.createText();
  await loadFont({ family: 'Inter', style: 'Regular' });
  trendText.fontName = { family: 'Inter', style: 'Regular' };
  trendText.fontSize = 11;
  trendText.characters = trend;
  trendText.name = 'Trend';

  const trendColor = hexToRgb(trendPositive ? AKOUNT_TOKENS.colors.green : AKOUNT_TOKENS.colors.red);
  trendText.fills = [{ type: 'SOLID', color: trendColor }];

  card.appendChild(labelText);
  card.appendChild(valueText);
  card.appendChild(trendText);

  return card;
}

// ═══════════════════════════════════════════════════════
// 4. SCREEN BUILDERS (Quick Screens Gallery)
// ═══════════════════════════════════════════════════════

async function buildDashboardScreen(): Promise<FrameNode> {
  const screen = figma.createFrame();
  screen.name = '📊 Dashboard Screen';
  screen.resize(1440, 900);

  const bgColor = hexToRgb(AKOUNT_TOKENS.colors.background.bg0);
  screen.fills = [{ type: 'SOLID', color: bgColor }];

  // Title
  const title = figma.createText();
  await loadFont({ family: 'Inter', style: 'Bold' });
  title.fontName = { family: 'Inter', style: 'Bold' };
  title.fontSize = 32;
  title.characters = 'Dashboard';
  title.x = 40;
  title.y = 40;

  const whiteColor = hexToRgb(AKOUNT_TOKENS.colors.text.primary);
  title.fills = [{ type: 'SOLID', color: whiteColor }];

  screen.appendChild(title);

  // Stat cards
  const stats = [
    { label: 'Total Revenue', value: '$48,392', trend: '+12.3%', positive: true },
    { label: 'Expenses', value: '$23,104', trend: '+5.2%', positive: false },
    { label: 'Net Income', value: '$25,288', trend: '+18.1%', positive: true },
  ];

  let cardX = 40;
  const cardY = 120;

  for (const stat of stats) {
    const card = await createStatCard(stat.label, stat.value, stat.trend, stat.positive, cardX, cardY);
    screen.appendChild(card);
    cardX += 280 + AKOUNT_TOKENS.spacing.lg;
  }

  // Action buttons
  const button1 = await createButton('New Invoice', 'default', 'default', 40, 280);
  const button2 = await createButton('View Reports', 'secondary', 'default', 180, 280);

  screen.appendChild(button1);
  screen.appendChild(button2);

  return screen;
}

async function buildInvoiceDetailScreen(): Promise<FrameNode> {
  const screen = figma.createFrame();
  screen.name = '📄 Invoice Detail Screen';
  screen.resize(1440, 900);

  const bgColor = hexToRgb(AKOUNT_TOKENS.colors.background.bg0);
  screen.fills = [{ type: 'SOLID', color: bgColor }];

  // Header
  const title = figma.createText();
  await loadFont({ family: 'Inter', style: 'Bold' });
  title.fontName = { family: 'Inter', style: 'Bold' };
  title.fontSize = 28;
  title.characters = 'Invoice #INV-001';
  title.x = 40;
  title.y = 40;

  const whiteColor = hexToRgb(AKOUNT_TOKENS.colors.text.primary);
  title.fills = [{ type: 'SOLID', color: whiteColor }];

  screen.appendChild(title);

  // Status badge
  const statusBadge = await createBadge('PAID', 'success', 240, 45);
  screen.appendChild(statusBadge);

  // Invoice card
  const invoiceCard = createCard(600, 400, 'glass', 40, 120);
  invoiceCard.name = 'Invoice Details';

  const cardTitle = figma.createText();
  await loadFont({ family: 'Inter', style: 'SemiBold' });
  cardTitle.fontName = { family: 'Inter', style: 'SemiBold' };
  cardTitle.fontSize = 18;
  cardTitle.characters = 'Invoice Details';
  cardTitle.fills = [{ type: 'SOLID', color: whiteColor }];

  invoiceCard.appendChild(cardTitle);
  screen.appendChild(invoiceCard);

  return screen;
}

async function buildBankingScreen(): Promise<FrameNode> {
  const screen = figma.createFrame();
  screen.name = '🏦 Banking Overview';
  screen.resize(1440, 900);

  const bgColor = hexToRgb(AKOUNT_TOKENS.colors.background.bg0);
  screen.fills = [{ type: 'SOLID', color: bgColor }];

  // Title
  const title = figma.createText();
  await loadFont({ family: 'Inter', style: 'Bold' });
  title.fontName = { family: 'Inter', style: 'Bold' };
  title.fontSize = 32;
  title.characters = 'Banking';
  title.x = 40;
  title.y = 40;

  const whiteColor = hexToRgb(AKOUNT_TOKENS.colors.text.primary);
  title.fills = [{ type: 'SOLID', color: whiteColor }];

  screen.appendChild(title);

  // Account cards
  const account1 = await createStatCard('Checking Account', '$12,450', '+$1,200', true, 40, 120);
  const account2 = await createStatCard('Savings Account', '$45,320', '+$890', true, 344, 120);

  screen.appendChild(account1);
  screen.appendChild(account2);

  // Transactions table
  const transactionsTable = await createTable(5, 4, 40, 280);
  screen.appendChild(transactionsTable);

  return screen;
}

// ═══════════════════════════════════════════════════════
// 5. PLUGIN MESSAGE HANDLER
// ═══════════════════════════════════════════════════════

figma.showUI(__html__, { width: 500, height: 700, themeColors: true });

figma.ui.onmessage = async (msg) => {
  try {
    let node: SceneNode | null = null;

    // Component creation handlers
    if (msg.type === 'create-button') {
      node = await createButton(msg.label, msg.variant, msg.size);
    } else if (msg.type === 'create-badge') {
      node = await createBadge(msg.label, msg.variant);
    } else if (msg.type === 'create-card') {
      node = createCard(msg.width || 400, msg.height || 300, msg.variant);
    } else if (msg.type === 'create-input') {
      node = await createInput(msg.placeholder);
    } else if (msg.type === 'create-table') {
      node = await createTable(msg.rows, msg.cols);
    } else if (msg.type === 'create-skeleton') {
      node = createSkeleton(msg.width, msg.height);
    } else if (msg.type === 'create-stat-card') {
      node = await createStatCard(
        msg.label || 'Metric',
        msg.value || '$0',
        msg.trend || '0%',
        msg.positive !== false,
        0,
        0
      );
    }
    // Screen builders
    else if (msg.type === 'build-dashboard') {
      node = await buildDashboardScreen();
    } else if (msg.type === 'build-invoice-detail') {
      node = await buildInvoiceDetailScreen();
    } else if (msg.type === 'build-banking') {
      node = await buildBankingScreen();
    }
    // Close plugin
    else if (msg.type === 'cancel') {
      figma.closePlugin();
      return;
    }

    if (node) {
      figma.currentPage.appendChild(node);
      figma.viewport.scrollAndZoomIntoView([node]);
      figma.notify(`✅ ${node.name} created!`);
    }
  } catch (error) {
    figma.notify(`❌ Error: ${error.message}`, { error: true });
  }
};
