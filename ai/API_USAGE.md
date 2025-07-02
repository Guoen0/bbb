# tldraw AI 模块接口使用说明

本模块为 tldraw 画布提供 AI 能力，包括自然语言生成图形、智能分析画布内容等。支持 React 组件集成和自定义 AI 服务对接。

## 1. 安装与引入

```ts
// 假设已安装 tldraw 及本 ai 模块
import { useTldrawAi, TldrawAiModule, TldrawAiTransform } from '@/ai'
```

---

## 2. React Hook 用法（推荐）

### 2.1 基本用法

在 tldraw 画布组件内，使用 `useTldrawAi` Hook：

```tsx
import { useTldrawAi } from '@/ai'
import { Editor } from 'tldraw'

function MyComponent({ editor }: { editor: Editor }) {
  // 传入编辑器实例和自定义 AI 生成函数
  const { prompt, repeat, cancel } = useTldrawAi({
    editor,
    generate: async ({ editor, prompt, signal }) => {
      // 这里调用你的 AI 服务，返回 TLAiChange[] 变更数组
      // 例如：const result = await fetchAiChanges(prompt)
      return []
    },
    // 可选：流式生成
    stream: async function* ({ editor, prompt, signal }) {
      // 这里实现流式 AI 变更生成
      // yield* ...
    }
  })

  // 触发 AI 生成
  const handleAi = () => {
    prompt('画一个红色的圆形')
  }

  return <button onClick={handleAi}>AI 画图</button>
}
```

### 2.2 参数说明

- `editor`：tldraw 编辑器实例（必填）
- `generate`：AI 生成函数，返回变更数组（必填）
- `stream`：AI 流式生成函数，返回 AsyncGenerator（可选）
- `prompt(message)`：触发 AI 生成，message 可为字符串或对象
- `repeat()`：重复上一次 prompt
- `cancel()`：取消当前 AI 操作

---

## 3. 低阶类用法

### 3.1 直接使用 AI 管理器

```ts
import { TldrawAiModule } from '@/ai'
import { Editor } from 'tldraw'

const ai = new TldrawAiModule({ editor })

// 生成 prompt 并获取处理函数
const { prompt, handleChange } = await ai.generate('请画一个蓝色矩形')

// 你可以用 handleChange(change) 应用 AI 变更到画布
```

---

## 4. 类型说明

- `TldrawAiGenerateFn`：AI 生成函数签名
- `TldrawAiStreamFn`：AI 流式生成函数签名
- `TldrawAiPromptOptions`：prompt 参数类型（字符串或对象）
- `TLAiChange`：AI 生成的变更类型（如创建/修改/删除 shape）
- `TLAiPrompt`：AI prompt 结构体，包含消息、画布内容、截图等

---

## 5. 高级用法：自定义变换器

可通过继承 `TldrawAiTransform`，对 prompt 或 AI 变更做自定义处理：

```ts
import { TldrawAiTransform } from '@/ai'

class MyTransform extends TldrawAiTransform {
  transformPrompt(prompt) {
    // 修改 prompt
    return prompt
  }
  transformChange(change) {
    // 修改单个变更
    return change
  }
  transformChanges(changes) {
    // 批量修改变更
    return changes
  }
}
```

在 `useTldrawAi` 或 `TldrawAiModule` 传入 `transforms: [MyTransform]` 即可。

---

## 6. 常见问题

- 必须在 tldraw 编辑器上下文中使用（或手动传入 editor 实例）
- 需自行实现 AI 生成函数（可对接 OpenAI、Claude 等）
- 支持撤销、取消、历史记录等

---

## 7. 参考

- [tldraw 官方文档](https://tldraw.dev)
- [AI starter template](https://github.com/tldraw/ai-template)

---

如需更详细的类型定义和扩展方式，请查阅源码 `ai/src/lib/types.ts` 和 `ai/src/lib/useTldrawAi.ts`。 