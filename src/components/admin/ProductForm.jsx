import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../services/firebase'
import { doc, getDoc, addDoc, updateDoc, collection } from 'firebase/firestore'
import { uploadImageToCloudinary } from '../../services/cloudinary'
import { CATEGORIES } from '../../data/constants'

export default function ProductForm({ productId = null }) {
  const navigate = useNavigate()
  const isEditing = !!productId

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(isEditing)

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: CATEGORIES[1],
    description: '',
    sizes: ["P", "M", "G", "GG"],
    img: null,
    gallery: []
  })

  const [mainPreview, setMainPreview] = useState(null)

  const [mainImageFile, setMainImageFile] = useState(null)
  const [galleryFiles, setGalleryFiles] = useState([])

  useEffect(() => {
    if (!isEditing) return

    async function loadProduct() {
      try {
        const docRef = doc(db, "products", productId)
        const snapshot = await getDoc(docRef)

        if (snapshot.exists()) {
          const data = snapshot.data()
          setFormData({
            ...data,
            gallery: data.gallery || []
          })
          setMainPreview(data.img)
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

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  function handleMainImage(e) {
    const image = e.target.files[0]
    if (image) {
      setMainImageFile(image)
      setMainPreview(URL.createObjectURL(image))
    }
  }

  function handleGalleryFiles(e) {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      setGalleryFiles(prev => [...prev, ...files])
    }
  }

  function removeGalleryItem(index, isNewFile = false) {
    if(isNewFile) {
        setGalleryFiles(prev => prev.filter((_, i) => i !== index))
    } else {
        setFormData(prev => ({
            ...prev,
            gallery: prev.gallery.filter((_, i) => i !== index)
        }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      let mainImageUrl = formData.img

      if (mainImageFile) {
        const url = await uploadImageToCloudinary(mainImageFile)
        if(url) mainImageUrl = url
      }

      let newGalleryUrls = []
      if (galleryFiles.length > 0) {
        const uploadPromises = galleryFiles.map(file => uploadImageToCloudinary(file))
        newGalleryUrls = await Promise.all(uploadPromises)
      }

      const finalGallery = [
        ...formData.gallery,
        ...newGalleryUrls
      ]

      if(!finalGallery.includes(mainImageUrl)) {
          finalGallery.unshift(mainImageUrl)
      }

      const payload = {
        ...formData,
        price: Number(formData.price),
        img: mainImageUrl,
        gallery: finalGallery,
        updated_at: new Date()
      }
      
      if(!payload.created_at) payload.created_at = new Date()

      if (isEditing) {
        await updateDoc(doc(db, "products", productId), payload)
        alert("Produto e Galeria atualizados!")
      } else {
        await addDoc(collection(db, "products"), payload)
        alert("Produto cadastrado com sucesso!")
      }

      navigate('/admin/dashboard')

    } catch (error) {
      console.error(error)
      alert("Erro ao salvar. Verifique o console.")
    } finally {
      setLoading(false)
    }
  }

  if (fetchingData) return <div className="text-white p-10">Carregando dados...</div>

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold uppercase italic text-white">
        {isEditing ? `Editar: ${formData.name}` : 'Novo Produto'}
      </h1>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-widest text-white/50">Foto de Capa (Principal)</label>
        <label className="w-full h-80 bg-zinc-900 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-white transition-all overflow-hidden relative">
            <input type="file" onChange={handleMainImage} className="hidden" accept="image/*" />
            {mainPreview ? (
            <img src={mainPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
            <span className="text-white/50">Clique para adicionar capa</span>
            )}
        </label>
      </div>

      <div className="space-y-4 border-t border-white/10 pt-6">
        <div className="flex justify-between items-center">
            <label className="text-xs uppercase tracking-widest text-white/50">Galeria de Fotos</label>
            <label className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 text-xs uppercase font-bold cursor-pointer rounded transition-colors">
                + Adicionar Fotos
                <input type="file" multiple onChange={handleGalleryFiles} className="hidden" accept="image/*" />
            </label>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {formData.gallery.map((url, index) => (
                <div key={url} className="relative aspect-square bg-zinc-800 rounded overflow-hidden group">
                    <img src={url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                    <button 
                        type="button"
                        onClick={() => removeGalleryItem(index, false)}
                        className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        X
                    </button>
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 px-1 rounded text-white/70">Salva</span>
                </div>
            ))}

            {galleryFiles.map((file, index) => (
                <div key={index} className="relative aspect-square bg-zinc-800 rounded overflow-hidden group border-2 border-green-500/30">
                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                    <button 
                        type="button"
                        onClick={() => removeGalleryItem(index, true)}
                        className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    >
                        X
                    </button>
                    <span className="absolute bottom-1 left-1 text-[10px] bg-green-900 px-1 rounded text-white font-bold">Nova</span>
                </div>
            ))}
        </div>
      </div>

      <div className="space-y-4 border-t border-white/10 pt-6">
        <input
            name="name"
            placeholder="Nome do Produto"
            value={formData.name}
            onChange={handleChange}
            className="w-full bg-zinc-900 p-4 border border-white/10 text-white outline-none focus:border-white"
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
            className="w-full bg-zinc-900 p-4 border border-white/10 text-white outline-none focus:border-white resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black font-black uppercase py-4 hover:bg-zinc-200 transition-colors disabled:opacity-50 tracking-[0.2em]"
      >
        {loading ? 'Subindo Imagens...' : 'Salvar Alterações'}
      </button>
    </form>
  )
}