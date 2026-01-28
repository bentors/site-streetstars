import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../services/firebase' // Caminho corrigido
import { doc, getDoc, addDoc, updateDoc, collection } from 'firebase/firestore'
import { uploadImageToCloudinary } from '../../services/cloudinary' // Caminho corrigido
import { CATEGORIES } from '../../data/constants'

export default function ProductForm({ productId = null }) {
  const navigate = useNavigate()
  const isEditing = !!productId

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(isEditing)

  // Estados do Formulário
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: CATEGORIES[1], // Pula o "TODOS"
    description: '',
    sizes: ["P", "M", "G", "GG"], // Padrão
    img: null
  })

  const [preview, setPreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)

  // 1. Se for edição, busca os dados
  useEffect(() => {
    if (!isEditing) return

    async function loadProduct() {
      try {
        const docRef = doc(db, "products", productId)
        const snapshot = await getDoc(docRef)

        if (snapshot.exists()) {
          const data = snapshot.data()
          setFormData(data)
          setPreview(data.img)
        } else {
          alert("Produto não encontrado")
          navigate('/admin/dashboard')
        }
      } catch (error) {
        console.log(error)
      } finally {
        setFetchingData(false)
      }
    }
    loadProduct()
  }, [productId, isEditing, navigate])

  // 2. Manipula inputs de texto
  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // 3. Manipula imagem
  function handleFile(e) {
    const image = e.target.files[0]
    if (image && (image.type === 'image/jpeg' || image.type === 'image/png' || image.type === 'image/webp')) {
      setImageFile(image)
      setPreview(URL.createObjectURL(image))
    }
  }

  // 4. Enviar (Salvar ou Atualizar)
  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      let imageUrl = formData.img

      // Se tem nova imagem, faz upload
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile)
      }

      const payload = {
        ...formData,
        price: Number(formData.price),
        img: imageUrl,
        gallery: [imageUrl], // Simplificação para manter compatibilidade
        created_at: formData.created_at || new Date()
      }

      if (isEditing) {
        await updateDoc(doc(db, "products", productId), payload)
        alert("Atualizado com sucesso!")
      } else {
        await addDoc(collection(db, "products"), payload)
        alert("Cadastrado com sucesso!")
      }

      navigate('/admin/dashboard')

    } catch (error) {
      console.error(error)
      alert("Erro ao salvar")
    } finally {
      setLoading(false)
    }
  }

  if (fetchingData) return <div className="text-white p-10">Carregando dados...</div>

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold uppercase italic">
        {isEditing ? `Editar: ${formData.name}` : 'Novo Produto'}
      </h1>

      {/* UPLOAD */}
      <label className="w-full h-64 bg-zinc-900 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-white transition-all overflow-hidden relative">
        <input type="file" onChange={handleFile} className="hidden" />
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white/50">Clique para adicionar foto</span>
        )}
      </label>

      {/* CAMPOS */}
      <input
        name="name"
        placeholder="Nome do Produto"
        value={formData.name}
        onChange={handleChange}
        className="bg-zinc-900 p-4 border border-white/10 text-white outline-none focus:border-white"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <input
          name="price"
          type="number"
          step="0.01"
          placeholder="Preço"
          value={formData.price}
          onChange={handleChange}
          className="bg-zinc-900 p-4 border border-white/10 text-white outline-none focus:border-white"
          required
        />
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="bg-zinc-900 p-4 border border-white/10 text-white outline-none focus:border-white"
        >
          {CATEGORIES.filter(c => c !== "TODOS").map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <textarea
        name="description"
        rows={4}
        placeholder="Descrição"
        value={formData.description}
        onChange={handleChange}
        className="bg-zinc-900 p-4 border border-white/10 text-white outline-none focus:border-white resize-none"
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-white text-black font-black uppercase py-4 hover:bg-zinc-200 transition-colors disabled:opacity-50"
      >
        {loading ? 'Salvando...' : (isEditing ? 'Atualizar Produto' : 'Cadastrar Produto')}
      </button>
    </form>
  )
}