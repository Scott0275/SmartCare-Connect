# 🎬 How to Add Your Demo Video - Complete Guide

## Quick Overview

You now have a professional video section that:
- ✅ Shows an interactive play button overlay
- ✅ Loads video on click
- ✅ Responsive on all devices
- ✅ Plays fullscreen

All you need to do is replace the placeholder video URL with your actual video!

---

## Option 1: YouTube Video (Easiest) 🎥

### Step 1: Upload to YouTube
1. Go to [YouTube Studio](https://studio.youtube.com)
2. Click "Create" → "Upload video"
3. Select your 60-second demo video
4. Add title: "SmartCare - 60 Second Demo"
5. Set to "Unlisted" (only people with link can view)
6. Publish

### Step 2: Get the Video ID
The URL will look like: `https://www.youtube.com/watch?v=ABC123DEF456`

The video ID is: `ABC123DEF456`

### Step 3: Update Landing Page
Edit `script.js` and find this line:

```javascript
const videoUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
```

Replace `dQw4w9WgXcQ` with your video ID:

```javascript
const videoUrl = 'https://www.youtube.com/embed/ABC123DEF456';
```

### Step 4: Test
1. Push to GitHub
2. Amplify auto-deploys
3. Click play button - your video should play!

**⏱️ Time to Complete: 5 minutes**

---

## Option 2: Vimeo Video (Professional)

### Step 1: Upload to Vimeo
1. Go to [Vimeo.com](https://vimeo.com)
2. Click "Upload" → Choose your 60-second demo
3. Set privacy to "Anyone with the link"
4. Get the video ID from the URL

### Step 2: Get Video ID
URL format: `https://vimeo.com/VIDEO_ID`

### Step 3: Update Landing Page
Edit `script.js`:

```javascript
const videoUrl = 'https://player.vimeo.com/video/VIDEO_ID';
```

**⏱️ Time to Complete: 8 minutes**

---

## Option 3: Host on Your Own Server

### Step 1: Prepare Video File
- Format: MP4 (H.264 video, AAC audio)
- Size: Keep under 50MB for web
- Duration: 60 seconds

### Step 2: Upload to Hosting
Options:
- AWS S3 (recommended)
- Cloudinary (image/video CDN)
- Your own server

### Step 3: Update HTML
Edit `index.html` - Replace the iframe with a video element:

```html
<div class="video-player">
    <video width="100%" height="100%" controls>
        <source src="https://your-domain.com/videos/demo.mp4" type="video/mp4">
        Your browser does not support the video tag.
    </video>
</div>
```

**⏱️ Time to Complete: 15-30 minutes**

---

## Option 4: Screencast with Demo (Recommended for Product Demo)

### Tools to Use
1. **OBS Studio** (Free, professional)
2. **Loom** (Free, easy cloud sharing)
3. **Camtasia** (Paid, polished)

### What to Record
1. Open SmartCare app
2. Create a patient (5 seconds)
3. Record a visit (45 seconds)
4. Show sync happening (10 seconds)

### After Recording
1. Edit to exactly 60 seconds
2. Add text overlay: "Document patient visits in under 60 seconds"
3. Add your clinic name/logo
4. Export as MP4

Then follow **Option 1** (YouTube) or **Option 2** (Vimeo)

**⏱️ Time to Complete: 30-45 minutes**

---

## Demo Video Script (If Creating One)

### Timing Breakdown

| Time | What | Duration |
|------|------|----------|
| 0:00 | Title: "SmartCare Demo" | 3 sec |
| 0:03 | Open app, show offline indicator | 5 sec |
| 0:08 | Create new patient (name, age, ID) | 8 sec |
| 0:16 | Show patient list | 3 sec |
| 0:19 | Start recording visit | 2 sec |
| 0:21 | Add symptoms | 8 sec |
| 0:29 | Add diagnosis | 5 sec |
| 0:34 | Add treatment/prescription | 8 sec |
| 0:42 | Show "Visit recorded successfully" | 3 sec |
| 0:45 | Show patient history synced | 5 sec |
| 0:50 | End screen: "Never lose a patient record" | 10 sec |
| 1:00 | Total | 60 sec |

---

## Testing Your Video

### Desktop Testing
```
✓ Chrome - Click play, full-screen works
✓ Firefox - Video plays without issues
✓ Safari - Audio/video codec compatible
✓ Mobile Chrome - Responsive sizing
```

### Mobile Testing
```
✓ iOS Safari - Full-screen portrait/landscape
✓ Android Chrome - Touch play button works
✓ Network - Video loads on 4G
✓ Orientation - Aspect ratio maintained
```

### Accessibility Testing
```
✓ Keyboard - Tab to play button, Enter to click
✓ Screen readers - Title and description read
✓ Captions - Optional but recommended (upload to YouTube)
✓ Controls - Native browser controls visible
```

---

## Video SEO Tips

### YouTube Optimization
1. **Title**: "SmartCare - 60 Second Product Demo | Offline EHR"
2. **Description**: 
   ```
   See SmartCare in action. Document patient visits in under 60 seconds, works offline, and syncs automatically.
   
   - Create patient instantly
   - Record visit in 60 seconds
   - Automatic sync when connected
   
   Get early access: [your-landing-page-link]
   ```
3. **Tags**: SmartCare, EHR, EMR, Healthcare, Demo
4. **Thumbnail**: Custom (clinic scene or patient record)

### Landing Page Integration
- Embed video is already optimized
- Video plays directly (no redirect)
- Falls back gracefully if video fails

---

## Common Issues & Fixes

### "Video Won't Load"
**Problem**: Blank screen, no play button
**Solution**:
```javascript
// Check URL is correct
console.log('Video URL:', videoUrl);

// Test in browser:
// https://www.youtube.com/embed/ABC123DEF456

// Make sure ABC123DEF456 is your actual video ID
```

### "Video Plays But No Sound"
**Problem**: Video plays but muted
**Solution for YouTube**:
```html
<!-- Add allowfullscreen and allow autoplay -->
<iframe allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
</iframe>
```

### "Overlay Doesn't Click"
**Problem**: Click doesn't load video
**Solution**: Check `script.js` Event Listener
```javascript
// Verify this code is running:
const videoOverlay = document.getElementById('video-overlay');
if (videoOverlay) {
    videoOverlay.addEventListener('click', function() {
        console.log('Clicked!'); // Should see in console
    });
}
```

### "Mobile Video Too Small"
**Problem**: Video doesn't fill container on mobile
**Solution**: Already handled! But if issues:
```css
.video-placeholder {
    aspect-ratio: 16 / 9;      /* Desktop */
    min-height: 250px;          /* Mobile minimum */
    width: 100%;
    max-width: 100%;
}
```

---

## Deployment Steps

### After Choosing Your Video Option

1. **Prepare Video**
   - Upload to YouTube/Vimeo, OR
   - Upload to your server

2. **Get Video URL**
   - YouTube: `https://www.youtube.com/embed/VIDEO_ID`
   - Vimeo: `https://player.vimeo.com/video/VIDEO_ID`
   - Self-hosted: `https://yoursite.com/videos/demo.mp4`

3. **Update script.js**
   ```javascript
   const videoUrl = 'YOUR_VIDEO_URL_HERE';
   ```

4. **Test Locally (Optional)**
   ```bash
   cd landing
   python -m http.server 8000
   # Visit http://localhost:8000 and test video
   ```

5. **Commit & Push**
   ```bash
   git add landing/script.js
   git commit -m "Update demo video URL"
   git push origin main
   ```

6. **Amplify Auto-Deploys**
   - Watch deployment in Amplify console
   - Takes 1-2 minutes
   - Your landing page updates automatically

---

## Performance Optimization

### For YouTube Videos
- Already optimized (CDN hosted)
- No additional steps needed
- ~50MB cached by YouTube

### For Self-Hosted Videos
```javascript
// Add lazy loading (only load when section visible)
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.src = 'https://your-video-url.mp4';
            observer.unobserve(entry.target);
        }
    });
});
```

### File Size Optimization
```bash
# For MP4 files, compress without quality loss:
ffmpeg -i demo.mp4 -c:v libx264 -preset slow -crf 21 demo-compressed.mp4

# Result: Usually 70-80% smaller file
```

---

## Analytics & Tracking

### Track Video Plays
Add this to `script.js`:

```javascript
videoOverlay.addEventListener('click', function() {
    // Track event
    app.trackEvent('video_demo_played', {
        timestamp: new Date().toISOString(),
        source: 'landing-page'
    });
    
    // Load video...
});
```

### Monitor Engagement
- Track in Google Analytics
- Monitor completion rate (YouTube analytics)
- A/B test different videos

---

## Next Steps

1. **Choose your video option** (YouTube recommended for simplicity)
2. **Prepare your 60-second demo**
3. **Update the video URL** in `script.js`
4. **Push to GitHub** (Amplify auto-deploys)
5. **Test on mobile and desktop**
6. **Share landing page** with your team

---

## Still Have Questions?

### Quick Checklist
- [ ] Video is exactly 60 seconds
- [ ] Video URL is correct
- [ ] Updated `script.js` with URL
- [ ] Pushed to GitHub
- [ ] Amplify deployment completed
- [ ] Tested video plays on mobile
- [ ] Tested video plays on desktop
- [ ] Can go fullscreen
- [ ] Audio works

**Once all checked ✓ - You're done!**

---

## Example Video URLs (for reference)

```javascript
// YouTube example
const videoUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ';

// Vimeo example
const videoUrl = 'https://player.vimeo.com/video/123456789';

// Self-hosted example
const videoUrl = 'https://cdn.smartcare.com/demo.mp4';
```

