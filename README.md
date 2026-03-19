# Summary

This project focused on redesigning the product configurator to deliver a modern UI, a fully responsive mobile experience, and significantly improved performance

The application was rebuilt using Svelte with TypeScript for a scalable and maintainable frontend architecture. All 3D assets were reprocessed through an optimization pipeline, leveraging gltfpack for geometry compression and KTX2 for texture optimization.

These improvements resulted in a 63% reduction in draw calls (366 → 138) and a 75% decrease in initial asset payload (23.5 MB → 5.9 MB). As a result, the configurator now achieves consistent 60 FPS on mobile devices and stable 144 FPS on desktop, even under the most demanding configurations.

Performance was approached holistically, focusing on reducing draw calls, minimizing texture memory usage, and dynamically scaling rendering quality based on device capabilities.

# Mobile Specific Optimizations

To ensure optimal performance across a wide range of devices, the application includes a dynamic profiling system that evaluates client hardware capabilities at runtime. Based on this assessment, it automatically adjusts rendering settings, such as selecting lower-resolution textures and reducing device pixel ratio (DPR) to maintain smooth performance without compromising visual quality.

# Asset Delivery

All assets are served through Cloudflare R2 object storage, enabling low-latency delivery and efficient streaming of 3D models and textures. This approach improves load times and ensures consistent performance across different geographic regions.

# UI

The frontend was built as a Single Page Application (SPA) using Svelte, providing a fast, reactive UI with seamless, real-time synchronization between user interactions and the 3D scene.

Custom icons and visual assets were created using Adobe Illustrator and Blender, supporting a cohesive and polished user experience.
