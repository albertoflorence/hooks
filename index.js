import createState from "./hooks.js"

const { render, useState, useEffect } = createState()

const Text = document.querySelector("#text")

export const App = () => {
  const [name, setName] = useState("João")
  const [age, setAge] = useState(30)

  useEffect(() => {
    setTimeout(() => setName("Maria"), 2000)
  }, [])

  useEffect(() => {
    setTimeout(() => setAge(age - 5), 1000)
  }, [name])

  Text.innerHTML = `Olá usuário(a) ${name} você tem ${age} anos !`
}

render(App)
