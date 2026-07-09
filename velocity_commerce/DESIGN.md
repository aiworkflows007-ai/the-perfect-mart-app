---
name: Velocity Commerce
colors:
  surface: '#f5fbee'
  surface-dim: '#d6dccf'
  surface-bright: '#f5fbee'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff6e9'
  surface-container: '#eaf0e3'
  surface-container-high: '#e4eadd'
  surface-container-highest: '#dee5d8'
  on-surface: '#171d15'
  on-surface-variant: '#3f4a3c'
  inverse-surface: '#2c322a'
  inverse-on-surface: '#ecf3e6'
  outline: '#6f7a6a'
  outline-variant: '#becab7'
  surface-tint: '#006e16'
  primary: '#006714'
  on-primary: '#ffffff'
  primary-container: '#0c831f'
  on-primary-container: '#e0ffd7'
  inverse-primary: '#74dd6e'
  secondary: '#745b00'
  on-secondary: '#ffffff'
  secondary-container: '#ffd24c'
  on-secondary-container: '#735a00'
  tertiary: '#a1275e'
  on-tertiary: '#ffffff'
  tertiary-container: '#c14177'
  on-tertiary-container: '#fff4f5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#8ffb87'
  primary-fixed-dim: '#74dd6e'
  on-primary-fixed: '#002203'
  on-primary-fixed-variant: '#00530e'
  secondary-fixed: '#ffe08d'
  secondary-fixed-dim: '#edc23c'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#584400'
  tertiary-fixed: '#ffd9e3'
  tertiary-fixed-dim: '#ffb0c9'
  on-tertiary-fixed: '#3e001e'
  on-tertiary-fixed-variant: '#89104c'
  background: '#f5fbee'
  on-background: '#171d15'
  surface-variant: '#F3F4F6'
  surface-main: '#FFFFFF'
  cosmetics-accent: '#FF85A2'
  granite-accent: '#475569'
  status-success: '#16A34A'
  status-error: '#DC2626'
  status-warning: '#F59E0B'
typography:
  display-eta:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  price-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  container-margin: 16px
  gutter: 12px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  touch-target: 48px
---

## Brand & Style

The brand personality is defined by **urgency, freshness, and dependability**. It is a high-energy platform that bridges the gap between digital convenience and physical logistics. The design style follows a **Corporate / Modern** approach with **Minimalist** sensibilities, ensuring that the interface remains invisible so that product photography and delivery ETAs take center stage.

The emotional response should be one of "instant relief"—the user feels that their needs are being met immediately. This is achieved through high-contrast typography, a vibrant "Action Green" that signals movement, and a spacious layout that prevents cognitive overload during rapid browsing. The UI is optimized for high-speed mobile interactions, featuring large touch targets and a clear visual hierarchy that guides the user from search to checkout in seconds.

## Colors

The palette is anchored by **Action Green**, a high-chroma shade representing freshness and speed. This is the primary driver for all "Commitment" actions (Add to Cart, Place Order). **Bold Yellow** is used sparingly as a secondary accent to highlight promotional banners or "Express" delivery tiers.

The system uses a high-contrast **light mode** by default to ensure legibility on low-end Android displays and in bright outdoor environments (critical for delivery riders). 

**Named Category Accents:**
- **Cosmetics:** A soft, approachable pink used for background washes in specific category tiles.
- **Granite/Hardware:** A sturdy slate grey to denote durability and weight.
- **Status Colors:** Standardized Red, Green, and Amber for order states, ensuring immediate recognition of "Delivered," "Out for Delivery," or "Issues Found."

## Typography

The design system utilizes **Inter** exclusively to ensure a systematic and utilitarian feel across both Native Android and Web PWA surfaces. 

- **Display ETA**: Reserved for the "Delivery in X mins" hero text. It uses a heavy weight and tight letter spacing to create a sense of urgency.
- **Price Hierarchy**: Prices are always rendered in a heavier weight than product names to facilitate quick cost-scanning.
- **Data Tables**: For technical attributes (like granite thickness or expiry dates), use `body-sm` to maintain data density without sacrificing readability.
- **Mobile Scaling**: Headlines scale down on mobile devices to prevent awkward text wrapping in grid-based category tiles.

## Layout & Spacing

This design system uses a **Fluid Grid** model optimized for mobile-first consumption. The layout relies on a 4px/8px rhythmic scale to maintain visual harmony.

- **Margins**: A standard 16px lateral margin is maintained across all screens to ensure content doesn't hit the bezel.
- **Category Grid**: Home screens utilize a 2-column or 3-column fluid grid for category tiles. Gutters are kept tight (12px) to maximize the "above the fold" product density.
- **Touch Targets**: All interactive elements (Add buttons, Navigation icons) must maintain a minimum height of 48px to accommodate rapid "single-tap" use cases by both customers and riders.
- **Spacing Philosophy**: Vertical stacks are preferred over horizontal scrolling where possible to allow for fast one-handed thumb scrolling.

## Elevation & Depth

Visual hierarchy is managed through **Tonal Layers** and **Ambient Shadows** to create a clear distinction between the "Map/Browse" background and "Action" elements.

- **Base Layer**: The background is typically flat white or a very light grey (`#F3F4F6`).
- **Product Cards**: Use a very subtle, low-opacity shadow (4% - 8% black) with a wide blur (12px) to make cards feel slightly raised without cluttering the UI.
- **Floating Actions**: The "View Cart" bar and "Place Order" buttons are treated as high-elevation elements. They utilize a more aggressive shadow or a solid top border to indicate they sit above the scrolling content.
- **Modals/Drawers**: Use a 40% opacity black backdrop blur to focus the user on the task (e.g., selecting an address or editing quantity).

## Shapes

The design system employs a **Rounded (Level 2)** shape language. This provides a modern, approachable feel while maintaining enough structure for technical data layouts.

- **Standard Buttons & Inputs**: 8px (0.5rem) corner radius.
- **Category Tiles & Product Cards**: 16px (1rem) corner radius to create a soft, "container" look that highlights product imagery.
- **Quantity Steppers**: Use a pill-shaped (fully rounded) design to distinguish them from static structural elements.
- **Badges**: Small status badges use a 4px radius to stay sharp and professional.

## Components

### Buttons & Steppers
- **Primary CTA**: Large, full-width buttons using the Action Green. Text is white and bold.
- **Quantity Stepper**: A specialized component that replaces the "ADD" button once an item is in the cart. It features a minus icon, current count, and plus icon. It should use a white background with a subtle border to stand out against the Action Green "ADD" button.
- **Ghost Buttons**: Used for secondary actions like "View Details" or "Apply Coupon," featuring a green outline and transparent background.

### Cards & Tiles
- **Product Cards**: Vertical orientation with the image at the top (aspect ratio 1:1), followed by the price, product name, and the "ADD" button at the bottom.
- **Category Tiles**: Square cards with a center-aligned icon or image and the category name at the bottom.

### Inputs & Search
- **Search Bar**: Sticky at the top of the home screen. It should include a "voice search" icon and use a subtle grey background with no border.
- **Status Badges**: Small, high-contrast labels used for ETAs ("8 MINS") or stock status ("Low Stock").

### Lists & Tables
- **Attribute Table**: For product specifications, use a zebra-striped list with light grey alternating rows to help readability on small screens.
- **Order Timeline**: A vertical connector line with dots representing the "Placed > Packed > Out for Delivery > Delivered" flow.