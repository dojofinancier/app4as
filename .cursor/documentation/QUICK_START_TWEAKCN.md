# Quick Start: Test TweakCN Styles

## ✅ Ready to Test!

Your HSL styles are ready. Here's how to test them:

### Option 1: Quick Test (Recommended)

1. **Backup your current styles:**
   ```bash
   cp app/globals.css app/globals.css.backup
   ```

2. **Temporarily swap the CSS file:**
   ```bash
   cp app/globals-tweakcn.css app/globals.css
   ```

3. **Start your dev server:**
   ```bash
   npm run dev
   ```

4. **View your site** - All pages will use the new TweakCN styles!

5. **To revert:**
   ```bash
   cp app/globals.css.backup app/globals.css
   ```

### Option 2: Use Preview Page

1. **Keep your current styles** in `app/globals.css`
2. **Visit:** `http://localhost:3000/style-preview`
3. **Toggle the checkbox** to enable TweakCN styles
4. **Navigate** through your site

### Option 3: Edit Layout Directly

In `app/layout.tsx`, temporarily change:
```typescript
// From:
import "./globals.css"

// To:
import "./globals-tweakcn.css"
```

## What Changed?

### Visual Changes:
- ✅ **Colors:** New color palette (teal primary, coral accent)
- ✅ **Border Radius:** Increased from 0.5rem to 1rem (more rounded)
- ✅ **Typography:** DM Sans font (if installed)
- ✅ **Letter Spacing:** Enhanced tracking system
- ✅ **Shadows:** Enhanced shadow system

### Technical Changes:
- ✅ Tailwind config updated to support new colors
- ✅ Chart colors added (chart-1 through chart-5)
- ✅ Sidebar colors added
- ✅ Shadow variables added
- ✅ Font variables added

## Color Palette Preview

**Light Mode:**
- **Primary:** Teal (`hsl(175.3448 100.0000% 22.7451%)`) - Deep teal
- **Secondary:** Deep red (`hsl(354.8718 100.0000% 22.9412%)`)
- **Accent:** Golden yellow (`hsl(37.6923 92.1260% 50.1961%)`)
- **Background:** Light cream (`hsl(80.0000 33.3333% 96.4706%)`)

**Dark Mode:**
- **Primary:** Light purple (`hsl(234.2857 89.7436% 77.0588%)`)
- **Secondary:** Teal (`hsl(172.4551 66.0079% 50.3922%)`)
- **Background:** Pure black (`hsl(0 0% 0%)`)

## Next Steps

1. **Test thoroughly** - Check all pages and components
2. **Verify fonts** - Make sure DM Sans and Space Mono are loaded
3. **Check dark mode** - Toggle dark mode to see changes
4. **If satisfied:** Replace `app/globals.css` permanently
5. **If not:** Adjust colors in `app/globals-tweakcn.css` and re-test

## Files Created

- ✅ `app/globals-tweakcn.css` - Ready-to-use TweakCN styles
- ✅ `app/globals.css.backup` - Your original styles (create this first!)
- ✅ `tailwind.config.ts` - Updated to support new colors
- ✅ `app/style-preview/page.tsx` - Preview page for testing

## Need Help?

- **Colors look wrong?** Check browser console for CSS errors
- **Fonts not loading?** Add Google Fonts import in `app/layout.tsx`
- **Want to adjust colors?** Edit values in `app/globals-tweakcn.css`
- **Revert changes?** Restore from `app/globals.css.backup`



