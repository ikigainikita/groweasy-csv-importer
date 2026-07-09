import { CSVImporter } from '@/components/CSVImporter'
import { Header } from '@/components/Header'

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <div className="container">
          <CSVImporter />
        </div>
      </main>
    </div>
  )
}

export default App