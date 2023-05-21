# Você já se perguntou qual é a mágica por trás do useState e useEffect?

Olá, eu sou um estudante na [Trybe](https://www.betrybe.com) e por ser alguém que desde criança sempre tenta descobrir como as coisas funcionam internamente, decidi me aventurar na criação da minha própria implementação de hooks !

Dentre os hooks do React, um dos mais importantes é o **useState**, que nos permite gerenciar o estado de um componente. Para entender como ele funciona, é necessário saber algumas coisas. Primeiro, precisamos passar o valor inicial para ele. O retorno do **useState** é um **array** com duas posições: a posição **0** é uma variável com o valor do estado e a posição **1** é uma função que pode alterar essa variável. O React recomenda adotar a seguinte prática:

```javascript
const [count, setCount] = useState(0)
```

A função **App** será executada toda vez que **setCount** for chamado, por causa disso o seguinte código criará um loop infinito:

```javascript
const App = () => {
  const [count, setCount] = useState(0)
  setCount() // isso causará um loop infinito!
}
```

Nesse contexto, ocorrerá um ciclo infinito de chamadas entre **App** e **setCount**.

É por esse motivo que geralmente só usamos **setState** dentro de uma função que será executada com alguma condição, como, por exemplo, quando o usuário clicar em um botão:

```javascript
const App = () => {
  const [count, setCount] = useState(0)

  return <button onClick={() => setCount(count + 1)}>Click me ! {count}</button>
}
```

Mas, se toda a função **App** é executada novamente, o estado inicial (0) também será sobrescrito?
A resposta é não, e a mágica por trás disso é algo chamado **Closure**:

```javascript
let state
function render() {...} // a ser implementado

function useState(initialState) {
  state = state ?? initialState
  function setState(newState) {
    state = newState
    render()
  }
  return [state, setState]
}
```

Nessa implementação simplificada, o estado é armazenado na variável **state**, que está fora do escopo da função **useState**. A cada renderização, o **useState** verifica se o estado já foi inicializado, utilizando o operador lógico **??,** e, caso contrário, atribui o valor inicial à variável **state**.

Quando a função **setState** é chamada, ela atualiza o estado na variável **state** e, em seguida, chama a função render, que será responsável por renderizar o componente novamente, refletindo as alterações do estado.

A função **render** é simples:

```javascript
let Component
let firstRender = true
let state

function render(item) {
  if (firstRender) {
    Component = item
    firstRender = false
  }
  Component()
}
```

Seu objetivo é armazenar o componente na variável **Component** durante a primeira renderização e, em seguida, chamá-lo.

Agora vamos dar mais um passo na nossa jornada em compreender os **React Hooks**! Como vimos anteriormente, fizemos uma implementação básica de **useState**. No entanto, podemos identificar algumas limitações na nossa abordagem, como por exemplo, estamos limitados a usar apenas um único **useState** no nosso componente.

Para solucionar esse problema, podemos fazer algumas modificações no nosso código. Vamos dar uma olhada:

```javascript
export default function () {
  let Component
  let firstRender = true
  let hooks = [] // um array de state
  let index = 0 // cada índice guarda o estado de um useState
  let resetIndex = () => (index = 0)

  function render() {...}

  function useState(initialState) {
    const currentIndex = index++ // preste atenção no uso de Closure nessa linha
    const state = hooks[currentIndex] ?? initialState
    hooks[currentIndex] = state
    function setState(value) {
      const newState = typeof value === 'function'
        ? value(hooks[currentIndex])
        : value
      hooks[currentIndex] = newState
      render()
    }
    return [state, setState]
  }

  function useEffect() {...}

  return { render, useState, useEffect }
}
```

Agora, ao usar o nosso **hook** personalizado, podemos utilizar vários **useState** dentro de um componente sem nenhum problema. Vejamos um exemplo:

```javascript
import createHook from './hooks.js'

const { render, useState, useEffect } = createHook()

const App = () => {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('John')
  const [age, setAge] = useState(18)
}

render(App)
```

Nessa nova versão do código, criamos um array **hooks** que armazena todos os estados. A cada chamada de **useState**, um novo elemento é adicionado ao array. No exemplo acima, o array **hooks** teria os valores **[0, 'John', 18]**. É importante observar que, ao salvar o valor de **index** em uma variável, garantimos que o valor dessa variável corresponda ao estado adequado quando estivermos dentro do **setState**. Isso é crucial porque o **index** é atualizado a cada chamada de **useState**.

Também tratamos um caso importante: quando **setState** recebe uma função como parâmetro. No exemplo abaixo, vamos entender o por que isso é importante:

```javascript
const App = () => {
  const [count, setCount] = useState(0)
  console.log(count) // 0, 50
  useEffect(() => {
    setCount(count + 50)
    setCount(count + 50) // o valor de count é 0 para todas as chamadas
    setCount(count + 50)
  }, [])
}

render(App)
```

Mesmo chamando **setCount** três vezes consecutivas, a função App só será executada duas vezes. Na primeira execução, o **console.log(count)** nos trará **0**, e quando a função passada para useEffect for executada, o uso dos três **setCount** causará apenas **uma** nova renderização de **App**. Portanto, o valor de count não será atualizado, permanecendo **0** nas três chamadas. Na segunda renderização de App, teremos o valor de **50** impresso no console.

Para resolver esse problema, podemos passar uma função para **setCount**:

```javascript
const App = () => {
  const [count, setCount] = useState(0)
  console.log(count) // 0, 150
  useEffect(() => {
    setCount((s) => s + 50) // s = 0
    setCount((s) => s + 50) // s = 50
    setCount((s) => s + 50) // s = 100
  }, [])
}

render(App)
```

A função App ainda só será executada duas vezes, mas **setCount** será executado todas as 3 vezes. O que acontece aqui é algo chamado Debounce:

```javascript
function render(item) {
  if (firstRender) {
    Component = debounce(item, 5) // Component só será executado quando não houver chamadas consecutivas
    firstRender = false
  }
  index = 0 // é necessário resetar o índice para cada nova renderização do componente
  Component()
}
```

A função **debounce** retorna outra função que executa a função que passamos para ela somente após um determinado tempo ter passado desde a última chamada. Dessa forma, mesmo que chamemos a função **Component** várias vezes consecutivamente, se não houver um intervalo mínimo de 5ms entre as chamadas, a função interna não será executada. Em outras palavras, o **debounce** nos permite adiar a execução de uma função até que ela não seja mais chamada por um determinado período de tempo.

Podemos implementá- la da seguinte forma:

```javascript
const debounce = (func, timeout) => {
  let timer
  return () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func()
    }, timeout)
  }
}
```

Essa técnica é chamada de **debounce** e é extremamente útil para controlar a frequência de execução de determinadas funções. Com o uso do debounce, podemos realizar várias chamadas consecutivas de **setState** dentro de uma função sem nos preocuparmos com múltiplas rerenderizações desnecessárias. O componente será renderizado apenas uma vez.

Agora vamos finalmente ver a implementação de **useEffect**:

```javascript
function useEffect(callback, deps) {
  let oldDeps = hooks[index]
  const hasChanged = oldDeps ? deps.some((dep, i) => oldDeps[i] !== dep) : true
  if (hasChanged) callback()
  hooks[index] = deps
  index++
}
```

A função **useEffect** recebe uma função que será executado pelo menos uma vez e sempre que alguma dependência, presente no array de dependências, for alterada. É importante destacar que não podemos usar diretamente um **useState** dentro do **useEffect**, pois isso causaria um **loop infinito**. Ao passar um **array vazio** como dependência, o **useEffect** será executado **apenas uma vez**.

```javascript
const App = () => {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('John')
  const [age, setAge] = useState(18)

  useEffect(() => {
    console.log('serei executado apenas uma vez!')
  }, [])

  useEffect(() => {
    console.log('serei executado sempre que "name" for modificada')
  }, [name])
}
```

Quando executarmos esse código, a variável hooks terá o seguinte valor: **[0, 'John', 18, [], ['John']]**. Os estados e as dependências são salvos na ordem em que são chamados, primeiro os três primeiros **useState** e, em seguida, os dois arrays de dependências dos **useEffects**.

E, para finalizar, faltou apenas um detalhe na função **render**:

```javascript
let index = 0
let resetIndex = () => {
  index = 0
}

function render(item) {
  if (firstRender) {
    Component = debounce(item, 5)
    resetIndex = debounce(item, 5)
    firstRender = false
  }
  resetIndex()
  Component()
}
```

Com essa correção, garantimos que o índice será redefinido para **0** antes de cada nova renderização do componente. Isso assegura que o array **hooks** funcione corretamente e mantenha o valor dos estados de acordo com as chamadas de **useState** e **useEffect**.

Com essas implementações, conseguimos criar uma versão básica de hooks personalizados que nos permite utilizar múltiplos **useState** dentro de um componente, lidar com atualizações de estado de forma adequada e controlar a execução do **useEffect** com base nas dependências.

É importante ressaltar que essa implementação simplificada dos **React Hooks** apresentada aqui é apenas uma ilustração para entender o funcionamento interno dessas funcionalidades. Nos projetos reais, é recomendado utilizar os Hooks fornecidos pelo React, que são testados, otimizados e possuem suporte completo.

Espero que essa publicação ajude a esclarecer como o **useState** e o **useEffect** funcionam internamente e como é possível criar **hooks** personalizados com base nesses conceitos. Os **React Hooks** são uma poderosa ferramenta para gerenciar o estado e o ciclo de vida dos componentes no React, tornando o desenvolvimento mais eficiente e organizado.

Existem vários outros materiais que falam sobre esse assunto, mas eu não poderia deixar de citar esse [aqui](https://medium.com/swlh/learn-by-implementing-reacts-usestate-and-useeffect-a-simplified-overview-ea8126705a88), que foi crucial para o desenvolvimento desse artigo.

Continue explorando e aprimorando suas habilidades no desenvolvimento com React e os conceitos relacionados aos **Hooks**. E lembre-se de compartilhar seu conhecimento e aprendizado com a comunidade para contribuir com o crescimento coletivo !
