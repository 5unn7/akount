"use strict";
// Akount Screen Builder - Main Plugin Code
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Akount Design System Tokens
const AKOUNT_TOKENS = {
    colors: {
        primary: '#F59E0B', // Amber orange
        green: '#34D399', // Income/success
        red: '#F87171', // Expense/error
        blue: '#60A5FA', // Transfer/info
        purple: '#A78BFA', // AI/purple
        teal: '#2DD4BF', // Teal accent
        background: {
            bg0: '#09090F', // Deepest
            bg1: '#0F0F17', // Sidebar/panels
            bg2: '#15151F', // Elevated cards
            bg3: '#1A1A26', // Hover states
            bg4: '#22222E', // Active states
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
// Utility: Convert hex to RGB for Figma
function hexToRgb(hex) {
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
// Utility: Convert rgba string to Figma RGBA
function rgbaToFigma(rgba) {
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
// Create a glass card component
function createGlassCard(width, height, x, y, variant = 'glass1') {
    const card = figma.createFrame();
    card.name = 'Glass Card';
    card.resize(width, height);
    card.x = x;
    card.y = y;
    // Glass background
    const glassColor = AKOUNT_TOKENS.colors.glass[variant];
    const glassRgba = rgbaToFigma(glassColor);
    card.fills = [{
            type: 'SOLID',
            color: { r: glassRgba.r, g: glassRgba.g, b: glassRgba.b },
            opacity: glassRgba.a,
        }];
    // Border
    const borderColor = rgbaToFigma(AKOUNT_TOKENS.colors.border.border1);
    card.strokes = [{
            type: 'SOLID',
            color: { r: borderColor.r, g: borderColor.g, b: borderColor.b },
            opacity: borderColor.a,
        }];
    card.strokeWeight = 1;
    // Border radius
    card.cornerRadius = AKOUNT_TOKENS.borderRadius.xl;
    // Padding via auto-layout
    card.layoutMode = 'VERTICAL';
    card.paddingLeft = AKOUNT_TOKENS.spacing.lg;
    card.paddingRight = AKOUNT_TOKENS.spacing.lg;
    card.paddingTop = AKOUNT_TOKENS.spacing.lg;
    card.paddingBottom = AKOUNT_TOKENS.spacing.lg;
    card.itemSpacing = AKOUNT_TOKENS.spacing.md;
    return card;
}
// Create a text node with Akount typography
function createText(text, style, fontSize, color = '#FFFFFF') {
    const textNode = figma.createText();
    // Load font asynchronously (Figma requires this)
    const fontName = style === 'heading'
        ? { family: 'Inter', style: 'Bold' } // Fallback to Inter (commonly available)
        : style === 'mono'
            ? { family: 'Roboto Mono', style: 'Regular' }
            : { family: 'Inter', style: 'Regular' };
    figma.loadFontAsync(fontName).then(() => {
        textNode.fontName = fontName;
        textNode.fontSize = fontSize;
        textNode.characters = text;
        const rgb = hexToRgb(color);
        textNode.fills = [{
                type: 'SOLID',
                color: rgb,
            }];
    });
    return textNode;
}
// Create a stat card (used in dashboards)
function createStatCard(label, value, trend, trendPositive, x, y) {
    const card = createGlassCard(280, 120, x, y, 'glass1');
    card.name = `Stat Card - ${label}`;
    // Label
    const labelText = createText(label.toUpperCase(), 'body', 11, '#71717A');
    labelText.name = 'Label';
    // Value
    const valueText = createText(value, 'mono', 32, '#FFFFFF');
    valueText.name = 'Value';
    // Trend
    const trendColor = trendPositive ? AKOUNT_TOKENS.colors.green : AKOUNT_TOKENS.colors.red;
    const trendText = createText(trend, 'body', 11, trendColor);
    trendText.name = 'Trend';
    card.appendChild(labelText);
    card.appendChild(valueText);
    card.appendChild(trendText);
    return card;
}
// Create a simple button
function createButton(label, variant, x, y) {
    const button = figma.createFrame();
    button.name = `Button - ${label}`;
    button.resize(120, 40);
    button.x = x;
    button.y = y;
    // Button style based on variant
    if (variant === 'primary') {
        const primaryColor = hexToRgb(AKOUNT_TOKENS.colors.primary);
        button.fills = [{ type: 'SOLID', color: primaryColor }];
    }
    else if (variant === 'dim') {
        const dimRgba = rgbaToFigma('rgba(245,158,11,0.14)');
        button.fills = [{
                type: 'SOLID',
                color: { r: dimRgba.r, g: dimRgba.g, b: dimRgba.b },
                opacity: dimRgba.a,
            }];
    }
    else {
        button.fills = [];
    }
    // Border
    const borderColor = rgbaToFigma(AKOUNT_TOKENS.colors.border.border1);
    button.strokes = [{
            type: 'SOLID',
            color: { r: borderColor.r, g: borderColor.g, b: borderColor.b },
            opacity: borderColor.a,
        }];
    button.strokeWeight = 1;
    button.cornerRadius = AKOUNT_TOKENS.borderRadius.md;
    button.layoutMode = 'HORIZONTAL';
    button.primaryAxisAlignItems = 'CENTER';
    button.counterAxisAlignItems = 'CENTER';
    button.paddingLeft = AKOUNT_TOKENS.spacing.md;
    button.paddingRight = AKOUNT_TOKENS.spacing.md;
    // Button text
    const buttonText = createText(label, 'body', 14, '#FFFFFF');
    button.appendChild(buttonText);
    return button;
}
// Build a sample dashboard screen
function buildDashboardScreen() {
    const screen = figma.createFrame();
    screen.name = '📊 Dashboard Screen';
    screen.resize(1440, 900);
    screen.x = 0;
    screen.y = 0;
    // Background
    const bgColor = hexToRgb(AKOUNT_TOKENS.colors.background.bg0);
    screen.fills = [{ type: 'SOLID', color: bgColor }];
    // Title
    const title = createText('Dashboard', 'heading', 32, '#FFFFFF');
    title.x = 40;
    title.y = 40;
    screen.appendChild(title);
    // Stat cards grid
    const statCards = [
        { label: 'Total Revenue', value: '$48,392', trend: '+12.3%', positive: true },
        { label: 'Expenses', value: '$23,104', trend: '+5.2%', positive: false },
        { label: 'Net Income', value: '$25,288', trend: '+18.1%', positive: true },
    ];
    let cardX = 40;
    const cardY = 120;
    statCards.forEach((stat, index) => {
        const card = createStatCard(stat.label, stat.value, stat.trend, stat.positive, cardX, cardY);
        screen.appendChild(card);
        cardX += 280 + AKOUNT_TOKENS.spacing.lg;
    });
    // Action buttons
    const button1 = createButton('New Invoice', 'primary', 40, 280);
    const button2 = createButton('View Reports', 'dim', 180, 280);
    screen.appendChild(button1);
    screen.appendChild(button2);
    return screen;
}
// Plugin message handler
figma.showUI(__html__, { width: 400, height: 600 });
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'create-blue-square') {
        // Create simple blue square
        const square = figma.createRectangle();
        square.resize(100, 100);
        square.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 1 } }];
        square.name = 'Blue Square 100px';
        figma.currentPage.appendChild(square);
        figma.viewport.scrollAndZoomIntoView([square]);
        figma.notify('✅ Created 100px blue square!');
    }
    if (msg.type === 'build-dashboard') {
        // Build full dashboard screen
        const dashboard = buildDashboardScreen();
        figma.currentPage.appendChild(dashboard);
        figma.viewport.scrollAndZoomIntoView([dashboard]);
        figma.notify('✅ Dashboard screen created!');
    }
    if (msg.type === 'create-stat-card') {
        const card = createStatCard(msg.label || 'Metric', msg.value || '$0', msg.trend || '0%', msg.positive !== false, 0, 0);
        figma.currentPage.appendChild(card);
        figma.viewport.scrollAndZoomIntoView([card]);
        figma.notify('✅ Stat card created!');
    }
    if (msg.type === 'cancel') {
        figma.closePlugin();
    }
});
