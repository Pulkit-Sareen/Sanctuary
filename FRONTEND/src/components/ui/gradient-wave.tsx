"use client";

import { useEffect, useRef } from 'react'

function normalizeColor(hexCode: number): number[] {
  return [
    ((hexCode >> 16) & 255) / 255,
    ((hexCode >> 8) & 255) / 255,
    (255 & hexCode) / 255,
  ]
}

type UniformType = 'float' | 'int' | 'vec2' | 'vec3' | 'vec4' | 'mat4' | 'array' | 'struct'

type UniformConfig = {
  type?: UniformType
  value: unknown
  excludeFrom?: string
  transpose?: boolean
}

type UniformInstance = {
  uniform: Uniform
  location: WebGLUniformLocation | null
}

type AttributeConfig = {
  target: number
  size: number
  type?: number
  normalized?: boolean
  values?: Float32Array | Uint16Array
}

class Uniform {
  type: UniformType = 'float'
  value: unknown
  typeFn: string
  excludeFrom?: string
  transpose?: boolean
  private context: WebGLRenderingContext

  constructor(context: WebGLRenderingContext, config: UniformConfig) {
    this.context = context
    Object.assign(this, config)

    const typeMap: Record<string, string> = {
      float: '1f',
      int: '1i',
      vec2: '2fv',
      vec3: '3fv',
      vec4: '4fv',
      mat4: 'Matrix4fv',
    }
    this.typeFn = typeMap[this.type] || '1f'
  }

  update(location: WebGLUniformLocation | null): void {
    if (this.value === undefined || location === null) return

    const isMatrix = this.typeFn.indexOf('Matrix') === 0
    const fn = `uniform${this.typeFn}` as keyof WebGLRenderingContext
    const uniformFn = this.context[fn]

    if (typeof uniformFn !== 'function') return

    if (isMatrix) {
      ;(uniformFn as WebGLRenderingContext['uniformMatrix4fv']).call(
        this.context,
        location,
        this.transpose || false,
        this.value as Float32List,
      )
    } else {
      ;(uniformFn as (...args: unknown[]) => void).call(this.context, location, this.value)
    }
  }

  getDeclaration(name: string, shaderType: string, length?: number): string {
    if (this.excludeFrom === shaderType) return ''

    if (this.type === 'array') {
      const values = this.value as Uniform[]
      return `${values[0].getDeclaration(name, shaderType, values.length)}
const int ${name}_length = ${values.length};`
    }

    if (this.type === 'struct') {
      let nameNoPrefix = name.replace('u_', '')
      nameNoPrefix = nameNoPrefix.charAt(0).toUpperCase() + nameNoPrefix.slice(1)

      const fields = Object.entries(this.value as Record<string, Uniform>)
        .map(([fieldName, uniform]) => uniform.getDeclaration(fieldName, shaderType).replace(/^uniform/, ''))
        .join('')

      return `uniform struct ${nameNoPrefix}
{
${fields}
} ${name}${length ? `[${length}]` : ''};`
    }

    return `uniform ${this.type} ${name}${length ? `[${length}]` : ''};`
  }
}

class Attribute {
  type: number
  normalized: boolean
  buffer: WebGLBuffer
  target: number
  size: number
  values?: Float32Array | Uint16Array
  private context: WebGLRenderingContext

  constructor(context: WebGLRenderingContext, config: AttributeConfig) {
    this.context = context
    this.type = context.FLOAT
    this.normalized = false
    this.buffer = context.createBuffer()!
    this.target = config.target
    this.size = config.size
    this.type = config.type ?? this.type
    this.normalized = config.normalized ?? this.normalized
    this.values = config.values
  }

  update(): void {
    if (this.values) {
      this.context.bindBuffer(this.target, this.buffer)
      this.context.bufferData(this.target, this.values, this.context.STATIC_DRAW)
    }
  }

  attach(name: string, program: WebGLProgram): number {
    const location = this.context.getAttribLocation(program, name)
    this.use(location)
    return location
  }

  use(location: number): void {
    this.context.bindBuffer(this.target, this.buffer)

    if (this.target === this.context.ARRAY_BUFFER && location >= 0) {
      this.context.enableVertexAttribArray(location)
      this.context.vertexAttribPointer(location, this.size, this.type, this.normalized, 0, 0)
    }
  }
}

class Material {
  uniforms: Record<string, Uniform>
  uniformInstances: UniformInstance[] = []
  program: WebGLProgram
  private context: WebGLRenderingContext
  private commonUniforms: Record<string, Uniform>

  constructor(
    context: WebGLRenderingContext,
    commonUniforms: Record<string, Uniform>,
    vertexShaders: string,
    fragments: string,
    uniforms: Record<string, Uniform> = {},
  ) {
    this.context = context
    this.commonUniforms = commonUniforms
    this.uniforms = uniforms

    const getShader = (type: number, source: string): WebGLShader => {
      const shader = context.createShader(type)!
      context.shaderSource(shader, source)
      context.compileShader(shader)
      if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
        throw new Error(context.getShaderInfoLog(shader) || 'Shader compilation error')
      }
      return shader
    }

    const getUniformDeclarations = (uniformList: Record<string, Uniform>, shaderType: string): string =>
      Object.entries(uniformList)
        .map(([uniform, value]) => value.getDeclaration(uniform, shaderType))
        .join('\n')

    const prefix = 'precision highp float;'
    const vertexSource = `
      ${prefix}
      attribute vec4 position;
      attribute vec2 uv;
      attribute vec2 uvNorm;
      ${getUniformDeclarations(this.commonUniforms, 'vertex')}
      ${getUniformDeclarations(uniforms, 'vertex')}
      ${vertexShaders}
    `

    const fragmentSource = `
      ${prefix}
      ${getUniformDeclarations(this.commonUniforms, 'fragment')}
      ${getUniformDeclarations(uniforms, 'fragment')}
      ${fragments}
    `

    this.program = context.createProgram()!
    context.attachShader(this.program, getShader(context.VERTEX_SHADER, vertexSource))
    context.attachShader(this.program, getShader(context.FRAGMENT_SHADER, fragmentSource))
    context.linkProgram(this.program)

    if (!context.getProgramParameter(this.program, context.LINK_STATUS)) {
      throw new Error(context.getProgramInfoLog(this.program) || 'Program linking error')
    }

    context.useProgram(this.program)
    this.attachUniforms(undefined, this.commonUniforms)
    this.attachUniforms(undefined, this.uniforms)
  }

  attachUniforms(name: string | undefined, uniforms: Record<string, Uniform> | Uniform): void {
    if (name === undefined) {
      Object.entries(uniforms as Record<string, Uniform>).forEach(([uniformName, uniform]) =>
        this.attachUniforms(uniformName, uniform),
      )
      return
    }

    const uniform = uniforms as Uniform

    if (uniform.type === 'array') {
      ;(uniform.value as Uniform[]).forEach((item, index) => this.attachUniforms(`${name}[${index}]`, item))
      return
    }

    if (uniform.type === 'struct') {
      Object.entries(uniform.value as Record<string, Uniform>).forEach(([fieldName, fieldUniform]) =>
        this.attachUniforms(`${name}.${fieldName}`, fieldUniform),
      )
      return
    }

    this.uniformInstances.push({
      uniform,
      location: this.context.getUniformLocation(this.program, name),
    })
  }
}

class PlaneGeometry {
  width = 1
  height = 1
  attributes: Record<string, Attribute>
  vertexCount = 0
  xSegCount = 0
  ySegCount = 0

  constructor(context: WebGLRenderingContext) {
    this.attributes = {
      position: new Attribute(context, {
        target: context.ARRAY_BUFFER,
        size: 3,
      }),
      uv: new Attribute(context, { target: context.ARRAY_BUFFER, size: 2 }),
      uvNorm: new Attribute(context, {
        target: context.ARRAY_BUFFER,
        size: 2,
      }),
      index: new Attribute(context, {
        target: context.ELEMENT_ARRAY_BUFFER,
        size: 3,
        type: context.UNSIGNED_SHORT,
      }),
    }
  }

  setTopology(xSegs = 1, ySegs = 1): void {
    this.xSegCount = xSegs
    this.ySegCount = ySegs
    this.vertexCount = (this.xSegCount + 1) * (this.ySegCount + 1)
    const quadCount = this.xSegCount * this.ySegCount * 2

    this.attributes.uv.values = new Float32Array(2 * this.vertexCount)
    this.attributes.uvNorm.values = new Float32Array(2 * this.vertexCount)
    this.attributes.index.values = new Uint16Array(3 * quadCount)

    for (let y = 0; y <= this.ySegCount; y += 1) {
      for (let x = 0; x <= this.xSegCount; x += 1) {
        const i = y * (this.xSegCount + 1) + x
        this.attributes.uv.values[2 * i] = x / this.xSegCount
        this.attributes.uv.values[2 * i + 1] = 1 - y / this.ySegCount
        this.attributes.uvNorm.values[2 * i] = (x / this.xSegCount) * 2 - 1
        this.attributes.uvNorm.values[2 * i + 1] = 1 - (y / this.ySegCount) * 2

        if (x < this.xSegCount && y < this.ySegCount) {
          const s = y * this.xSegCount + x
          this.attributes.index.values[6 * s] = i
          this.attributes.index.values[6 * s + 1] = i + 1 + this.xSegCount
          this.attributes.index.values[6 * s + 2] = i + 1
          this.attributes.index.values[6 * s + 3] = i + 1
          this.attributes.index.values[6 * s + 4] = i + 1 + this.xSegCount
          this.attributes.index.values[6 * s + 5] = i + 2 + this.xSegCount
        }
      }
    }

    this.attributes.uv.update()
    this.attributes.uvNorm.update()
    this.attributes.index.update()
  }

  setSize(width = 1, height = 1): void {
    this.width = width
    this.height = height
    this.attributes.position.values = new Float32Array(3 * this.vertexCount)

    const offsetX = width / -2
    const offsetY = height / -2
    const segWidth = width / this.xSegCount
    const segHeight = height / this.ySegCount

    for (let y = 0; y <= this.ySegCount; y += 1) {
      const posY = offsetY + y * segHeight
      for (let x = 0; x <= this.xSegCount; x += 1) {
        const posX = offsetX + x * segWidth
        const idx = y * (this.xSegCount + 1) + x
        this.attributes.position.values[3 * idx] = posX
        this.attributes.position.values[3 * idx + 1] = -posY
        this.attributes.position.values[3 * idx + 2] = 0
      }
    }

    this.attributes.position.update()
  }
}

class Mesh {
  geometry: PlaneGeometry
  material: Material
  attributeInstances: Array<{ attribute: Attribute; location: number }> = []
  private context: WebGLRenderingContext

  constructor(context: WebGLRenderingContext, geometry: PlaneGeometry, material: Material) {
    this.context = context
    this.geometry = geometry
    this.material = material

    Object.entries(this.geometry.attributes).forEach(([name, attribute]) => {
      this.attributeInstances.push({
        attribute,
        location: attribute.attach(name, this.material.program),
      })
    })
  }

  draw(): void {
    this.context.useProgram(this.material.program)
    this.material.uniformInstances.forEach(({ uniform, location }) => uniform.update(location))
    this.attributeInstances.forEach(({ attribute, location }) => attribute.use(location))
    this.context.drawElements(
      this.context.TRIANGLES,
      this.geometry.attributes.index.values?.length ?? 0,
      this.context.UNSIGNED_SHORT,
      0,
    )
  }
}

class MiniGl {
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  meshes: Mesh[] = []
  commonUniforms: Record<string, Uniform>
  width = 640
  height = 480

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const gl = this.canvas.getContext('webgl', { antialias: true })
    if (!gl) throw new Error('WebGL not supported')

    this.gl = gl
    const identityMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    this.commonUniforms = {
      projectionMatrix: new Uniform(this.gl, {
        type: 'mat4',
        value: identityMatrix,
      }),
      modelViewMatrix: new Uniform(this.gl, {
        type: 'mat4',
        value: identityMatrix,
      }),
      resolution: new Uniform(this.gl, { type: 'vec2', value: [1, 1] }),
      aspectRatio: new Uniform(this.gl, { type: 'float', value: 1 }),
    }
  }

  setSize(w = 640, h = 480): void {
    this.width = w
    this.height = h
    this.canvas.width = w
    this.canvas.height = h
    this.gl.viewport(0, 0, w, h)
    this.commonUniforms.resolution.value = [w, h]
    this.commonUniforms.aspectRatio.value = w / h
  }

  setOrthographicCamera(): void {
    this.commonUniforms.projectionMatrix.value = [
      2 / this.width,
      0,
      0,
      0,
      0,
      2 / this.height,
      0,
      0,
      0,
      0,
      -0.001,
      0,
      0,
      0,
      0,
      1,
    ]
  }

  createUniform(config: UniformConfig): Uniform {
    return new Uniform(this.gl, config)
  }

  createMaterial(vertexShaders: string, fragments: string, uniforms: Record<string, Uniform>): Material {
    return new Material(this.gl, this.commonUniforms, vertexShaders, fragments, uniforms)
  }

  createPlaneGeometry(): PlaneGeometry {
    return new PlaneGeometry(this.gl)
  }

  createMesh(geometry: PlaneGeometry, material: Material): Mesh {
    const mesh = new Mesh(this.gl, geometry, material)
    this.meshes.push(mesh)
    return mesh
  }

  render(): void {
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.clearDepth(1)
    this.meshes.forEach((mesh) => mesh.draw())
  }
}

type GradientUniforms = {
  u_time: Uniform
  u_shadow_power: Uniform
  u_darken_top: Uniform
  u_active_colors: Uniform
  u_global: Uniform
  u_vertDeform: Uniform
  u_baseColor: Uniform
  u_waveLayers: Uniform
}

type GradientDeform = {
  incline?: number
  offsetTop?: number
  offsetBottom?: number
  noiseFreq?: [number, number]
  noiseAmp?: number
  noiseSpeed?: number
  noiseFlow?: number
  noiseSeed?: number
}

class Gradient {
  canvas: HTMLCanvasElement
  colors: string[]
  minigl: MiniGl
  mesh!: Mesh
  uniforms!: GradientUniforms
  time = 0
  last = 0
  animationId?: number
  isPlaying = false
  private resizeHandler = () => this.resize()

  constructor(canvas: HTMLCanvasElement, colors: string[]) {
    this.canvas = canvas
    this.colors = colors
    this.minigl = new MiniGl(canvas)
    this.init()
  }

  init(): void {
    const sectionColors = this.colors.map((hex) => normalizeColor(parseInt(hex.replace('#', '0x'), 16)))
    const createUniform = (config: UniformConfig) => this.minigl.createUniform(config)

    this.uniforms = {
      u_time: createUniform({ value: 0 }),
      u_shadow_power: createUniform({ value: 5 }),
      u_darken_top: createUniform({ value: 0 }),
      u_active_colors: createUniform({
        value: [1, 1, 1, 1],
        type: 'vec4',
      }),
      u_global: createUniform({
        value: {
          noiseFreq: createUniform({
            value: [0.00014, 0.00029],
            type: 'vec2',
          }),
          noiseSpeed: createUniform({ value: 0.000005 }),
        },
        type: 'struct',
      }),
      u_vertDeform: createUniform({
        value: {
          incline: createUniform({ value: 0 }),
          offsetTop: createUniform({ value: -0.5 }),
          offsetBottom: createUniform({ value: -0.5 }),
          noiseFreq: createUniform({ value: [3, 4], type: 'vec2' }),
          noiseAmp: createUniform({ value: 320 }),
          noiseSpeed: createUniform({ value: 10 }),
          noiseFlow: createUniform({ value: 3 }),
          noiseSeed: createUniform({ value: 5 }),
        },
        type: 'struct',
        excludeFrom: 'fragment',
      }),
      u_baseColor: createUniform({
        value: sectionColors[0],
        type: 'vec3',
        excludeFrom: 'fragment',
      }),
      u_waveLayers: createUniform({
        value: [],
        excludeFrom: 'fragment',
        type: 'array',
      }),
    }

    for (let i = 1; i < sectionColors.length; i += 1) {
      ;(this.uniforms.u_waveLayers.value as Uniform[]).push(
        createUniform({
          value: {
            color: createUniform({
              value: sectionColors[i],
              type: 'vec3',
            }),
            noiseFreq: createUniform({
              value: [2 + i / sectionColors.length, 3 + i / sectionColors.length],
              type: 'vec2',
            }),
            noiseSpeed: createUniform({ value: 11 + 0.3 * i }),
            noiseFlow: createUniform({ value: 6.5 + 0.3 * i }),
            noiseSeed: createUniform({ value: 5 + 10 * i }),
            noiseFloor: createUniform({ value: 0.1 }),
            noiseCeil: createUniform({ value: 0.63 + 0.07 * i }),
          },
          type: 'struct',
        }),
      )
    }

    const vertexShader = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

vec3 blendNormal(vec3 base, vec3 blend) { return blend; }
vec3 blendNormal(vec3 base, vec3 blend, float opacity) { return (blend * opacity + base * (1.0 - opacity)); }

varying vec3 v_color;

void main() {
  float time = u_time * u_global.noiseSpeed;
  vec2 noiseCoord = resolution * uvNorm * u_global.noiseFreq;
  float tilt = resolution.y / 2.0 * uvNorm.y;
  float incline = resolution.x * uvNorm.x / 2.0 * u_vertDeform.incline;
  float offset = resolution.x / 2.0 * u_vertDeform.incline * mix(u_vertDeform.offsetBottom, u_vertDeform.offsetTop, uv.y);

  float noise = snoise(vec3(
    noiseCoord.x * u_vertDeform.noiseFreq.x + time * u_vertDeform.noiseFlow,
    noiseCoord.y * u_vertDeform.noiseFreq.y,
    time * u_vertDeform.noiseSpeed + u_vertDeform.noiseSeed
  )) * u_vertDeform.noiseAmp;

  noise *= 1.0 - pow(abs(uvNorm.y), 2.0);
  noise = max(0.0, noise);

  vec3 pos = vec3(position.x, position.y + tilt + incline + noise - offset, position.z);
  v_color = u_baseColor;

  for (int i = 0; i < u_waveLayers_length; i++) {
    if (u_active_colors[i + 1] == 1.) {
      WaveLayers layer = u_waveLayers[i];
      float layerNoise = smoothstep(
        layer.noiseFloor,
        layer.noiseCeil,
        snoise(vec3(
          noiseCoord.x * layer.noiseFreq.x + time * layer.noiseFlow,
          noiseCoord.y * layer.noiseFreq.y,
          time * layer.noiseSpeed + layer.noiseSeed
        )) / 2.0 + 0.5
      );
      v_color = blendNormal(v_color, layer.color, pow(layerNoise, 4.));
    }
  }

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`

    const fragmentShader = `
varying vec3 v_color;

void main() {
  vec3 color = v_color;
  if (u_darken_top == 1.0) {
    vec2 st = gl_FragCoord.xy/resolution.xy;
    color.g -= pow(st.y + sin(-12.0) * st.x, u_shadow_power) * 0.4;
  }
  gl_FragColor = vec4(color, 1.0);
}`

    const material = this.minigl.createMaterial(vertexShader, fragmentShader, this.uniforms)
    const geometry = this.minigl.createPlaneGeometry()
    this.mesh = this.minigl.createMesh(geometry, material)

    this.resize()
    window.addEventListener('resize', this.resizeHandler)
  }

  resize(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    this.minigl.setSize(width, height)
    this.minigl.setOrthographicCamera()

    const xSegCount = Math.ceil(width * 0.02)
    const ySegCount = Math.ceil(height * 0.05)
    this.mesh.geometry.setTopology(xSegCount, ySegCount)
    this.mesh.geometry.setSize(width, height)
    this.mesh.material.uniforms.u_shadow_power.value = width < 600 ? 5 : 6
  }

  applySettings({
    shadowPower,
    darkenTop,
    noiseSpeed,
    noiseFrequency,
    deform,
  }: {
    shadowPower: number
    darkenTop: boolean
    noiseSpeed: number
    noiseFrequency: [number, number]
    deform: GradientDeform
  }): void {
    this.uniforms.u_shadow_power.value = shadowPower
    this.uniforms.u_darken_top.value = darkenTop ? 1 : 0

    const globalUniforms = this.uniforms.u_global.value as Record<string, Uniform>
    globalUniforms.noiseFreq.value = noiseFrequency
    globalUniforms.noiseSpeed.value = noiseSpeed

    const deformUniforms = this.uniforms.u_vertDeform.value as Record<string, Uniform>
    Object.entries(deform).forEach(([key, value]) => {
      if (value !== undefined && deformUniforms[key]) {
        deformUniforms[key].value = value
      }
    })
  }

  animate = (timestamp: number): void => {
    if (!this.isPlaying) return

    this.time += Math.min(timestamp - this.last, 1000 / 15)
    this.last = timestamp
    this.uniforms.u_time.value = this.time
    this.minigl.render()

    this.animationId = requestAnimationFrame(this.animate)
  }

  start(): void {
    if (this.isPlaying) return

    this.isPlaying = true
    this.last = performance.now()
    this.animationId = requestAnimationFrame(this.animate)
  }

  stop(): void {
    this.isPlaying = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }

  destroy(): void {
    this.stop()
    window.removeEventListener('resize', this.resizeHandler)
  }
}

const defaultColors = [
  '#31483A',  // Deep Forest
  '#4E6852',  // Sage Green
  '#7D9B81',  // Moss Green
  '#F7F2E9',  // Warm Cream
]
const defaultNoiseFrequency: [number, number] = [0.0001, 0.0009]
const defaultDeform: GradientDeform = { incline: 0.45, noiseAmp: 180, noiseFlow: 5 }

interface GradientWaveProps {
  colors?: string[]
  isPlaying?: boolean
  className?: string
  shadowPower?: number
  darkenTop?: boolean
  noiseSpeed?: number
  noiseFrequency?: [number, number]
  deform?: GradientDeform
}

export function GradientWave({
  colors = defaultColors,
  isPlaying = true,
  className = '',
  shadowPower = 8,
  darkenTop = false,
  noiseSpeed = 0.00001,
  noiseFrequency = defaultNoiseFrequency,
  deform = defaultDeform,
}: GradientWaveProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gradientRef = useRef<Gradient | null>(null)

  useEffect(() => {
    if (!containerRef.current) return undefined

    const canvas = document.createElement('canvas')
    Object.assign(canvas.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      display: 'block',
    })
    containerRef.current.appendChild(canvas)

    try {
      const gradient = new Gradient(canvas, colors)
      gradient.applySettings({
        shadowPower,
        darkenTop,
        noiseSpeed,
        noiseFrequency,
        deform,
      })
      gradientRef.current = gradient

      if (isPlaying) gradient.start()
    } catch {
      canvas.remove()
    }

    return () => {
      gradientRef.current?.destroy()
      gradientRef.current = null
      canvas.remove()
    }
  }, [colors, darkenTop, deform, isPlaying, noiseFrequency, noiseSpeed, shadowPower])

  return <div ref={containerRef} className={`absolute inset-0 z-0 h-full w-full overflow-hidden ${className}`} />
}
