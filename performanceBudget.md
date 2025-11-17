# Performance Budget

## Asset Size Limits

### JavaScript
- **Main bundle**: < 250KB (gzipped)
- **Vendor bundle**: < 150KB (gzipped)
- **Page chunks**: < 50KB each (gzipped)
- **Total JS**: < 500KB (gzipped)

### CSS
- **Main stylesheet**: < 50KB (gzipped)
- **Component styles**: < 20KB (gzipped)
- **Total CSS**: < 100KB (gzipped)

### Images
- **Hero images**: < 200KB
- **Thumbnails**: < 50KB
- **Icons**: < 10KB each
- **Total images per page**: < 1MB

### Fonts
- **Web fonts**: < 100KB total
- **Font subsets**: Preferred
- **Font display**: swap

## Performance Metrics

### Core Web Vitals
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### Additional Metrics
- **First Contentful Paint (FCP)**: < 1.8s
- **Time to Interactive (TTI)**: < 3.5s
- **Speed Index**: < 3.0s
- **Total Blocking Time (TBT)**: < 200ms

## Network Conditions

### Target Performance
- **3G Regular**: TTI < 5s
- **3G Slow**: TTI < 8s
- **4G**: TTI < 3s
- **WiFi**: TTI < 2s

### Optimization Strategies
- Code splitting by route
- Lazy loading for non-critical components
- Image optimization and WebP format
- Service worker caching
- CDN for static assets

## Monitoring

### Automated Checks
- Lighthouse CI in build pipeline
- Bundle analyzer reports
- Performance regression alerts
- Real user monitoring (RUM)

### Manual Reviews
- Monthly performance audits
- Quarterly budget reviews
- Performance impact assessments
- Optimization opportunity identification

## Budget Enforcement

### Build Process
- Bundle size checks in CI/CD
- Performance budget failures block deployment
- Automated alerts for budget violations
- Performance regression prevention

### Monitoring Tools
- Webpack Bundle Analyzer
- Lighthouse CI
- Web Vitals monitoring
- Vercel Analytics