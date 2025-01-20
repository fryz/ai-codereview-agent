// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

// Define the line ending plugin inline
const lineEnding = () => ({
  name: 'line-ending',
  renderChunk(code) {
    return {
      code: code.replace(/\r\n/g, '\n'),
      map: null
    }
  }
})

const config = {
  input: 'src/index.ts',
  output: {
    esModule: true,
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    typescript(),
    nodeResolve(),
    commonjs(),
    lineEnding() // Add the plugin to the list
  ]
}

export default config
