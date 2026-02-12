import resolve from "@rollup/plugin-node-resolve"
import terser from "@rollup/plugin-terser"
import typescript from "@rollup/plugin-typescript"

export default {
  input: "src/index.ts",
  output: {
    file: "dist/requestjs.js",
    format: "es",
    inlineDynamicImports: true
  },
  plugins: [
    resolve(),
    typescript(),
    terser({
      mangle: false,
      compress: false,
      format: {
        beautify: true,
        indent_level: 2
      }
    })
  ]
}
