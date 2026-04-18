import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../services/firebase'
import { doc, getDoc, addDoc, updateDoc, collection } from 'firebase/firestore/lite'
import { uploadImageToCloudinary, validateImageFile } from '../../services/cloudinary'
import { CATEGORIES } from '../../data/constants'

const AVAILABLE_SIZES = ["P", "M", "G", "GG", "XG", "UN"]

export default function ProductForm({ productId = null }) {
  const navigate = useNavigate()
  const isEditing = !!productId

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(isEditing)

  const [newFeature, setNewFeature] = useState("")

  const [newColorName, setNewColorName] = useState("")
  const [newColorHex, setNewColorHex] = useState("#000000")

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '', 
    description: '',
    sizes: [], 
    colors: [],
    features: [], 
    img: null,
    gallery: [],
    isActive: true,
    isFeatured: false
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
            category: data.category || '',
            gallery: data.gallery || [],
            sizes: data.sizes || [],
            colors: data.colors || [],
            features: Array.isArray(data.features) ? data.features : [],
            isActive: data.isActive ?? true,
            isFeatured: data.isFeatured ?? false
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
    const file = e.target.files[0];
    if (!file) return;

    const { valid, error } = validateImageFile(file);
    if (!valid) {
      alert(error);
      e.target.value = '';
      return;
    }

    setMainImageFile(file);
    setMainPreview(URL.createObjectURL(file));
  }

  function handleGalleryFiles(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const invalid = files.find(f => !validateImageFile(f).valid);
    if (invalid) {
      const { error } = validateImageFile(invalid);
      alert(`Arquivo "${invalid.name}": ${error}`);
      e.target.value = '';
      return;
    }

    setGalleryFiles(prev => [...prev, ...files]);
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

  function toggleSize(size) {
    setFormData(prev => {
      const sizes = prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
      return { ...prev, sizes }
    })
  }

  function addColor(e) {
    e.preventDefault()
    if (!newColorName.trim()) return

    const colorObj = { name: newColorName, hex: newColorHex }

    const exists = formData.colors.some(c => c.hex === newColorHex && c.name === newColorName)
    if (exists) return

    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, colorObj]
    }))

    setNewColorName("")
  }

  function removeColor(index) {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }))
  }

  function addFeature(e) {
    e.preventDefault() 
    if (!newFeature.trim()) return

    setFormData(prev => ({
      ...prev,
      features: [...prev.features, newFeature]
    }))
    setNewFeature("")
  }

  function removeFeature(index) {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  function handleToggle(field) {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }))
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

      if(!finalGallery.includes(mainImageUrl) && mainImageUrl) {
          finalGallery.unshift(mainImageUrl)
      }

      const payload = {
        ...formData,
        name: formData.name.trim().slice(0, 100),
        description: formData.description.trim().slice(0, 2000),
        price: Math.max(0, Number(formData.price)),
        category: formData.category.trim(),
        features: formData.features.map(f => f.trim()).filter(Boolean),
        img: mainImageUrl,
        gallery: finalGallery,
        updated_at: new Date()
      }

      if (!payload.name || !payload.price || !payload.category || !payload.img) {
        alert('Preencha nome, preço, categoria e imagem antes de salvar.')
        setLoading(false)
        return
      }
      
      if(!payload.created_at) payload.created_at = new Date()

      if (isEditing) {
        await updateDoc(doc(db, "products", productId), payload)
        alert("Produto atualizado!")
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold uppercase italic text-white">
        {isEditing ? `Editar: ${formData.name}` : 'Novo Produto'}
      </h1>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-widest text-white/50">Foto de Capa</label>
        <label className="w-full h-80 bg-zinc-900 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-white transition-all overflow-hidden relative group">
            <input type="file" onChange={handleMainImage} className="hidden" accept="image/*" />
            {mainPreview ? (
            <>
                <img src={mainPreview} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <span className="absolute bottom-4 bg-black/50 px-3 py-1 text-xs text-white rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">Trocar Capa</span>
            </>
            ) : (
            <span className="text-white/50 font-light">+ Clique para adicionar capa</span>
            )}
        </label>
      </div>

      <div className="space-y-4 border-t border-white/10 pt-6">
        <div className="flex justify-between items-center">
            <label className="text-xs uppercase tracking-widest text-white/50">Galeria de Fotos</label>
            <label className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 text-xs uppercase font-bold cursor-pointer rounded transition-colors flex items-center gap-2">
                <span>+ Adicionar</span>
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
                    <span className="absolute bottom-1 left-1 text-[9px] uppercase tracking-wider bg-black/60 px-1 rounded text-white/90 backdrop-blur-sm">Salva</span>
                </div>
            ))}

            {galleryFiles.map((file, index) => (
                <div key={index} className="relative aspect-square bg-zinc-800 rounded overflow-hidden group border border-green-500/50">
                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                    <button 
                        type="button"
                        onClick={() => removeGalleryItem(index, true)}
                        className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    >
                        X
                    </button>
                    <span className="absolute bottom-1 left-1 text-[9px] uppercase tracking-wider bg-green-600 px-1 rounded text-white font-bold shadow-sm">Nova</span>
                </div>
            ))}
        </div>
      </div>

      <div className="space-y-4 border-t border-white/10 pt-6">
        <input
            name="name"
            placeholder="Nome do Produto (Ex: T-Shirt Street)"
            value={formData.name}
            onChange={handleChange}
            className="w-full bg-zinc-900 p-4 border border-white/10 text-white outline-none focus:border-white transition-colors"
            required
        />

        <div className="grid grid-cols-2 gap-4">
            <input
                name="price"
                type="number"
                step="0.01"
                placeholder="Preço (Ex: 129.90)"
                value={formData.price}
                onChange={handleChange}
                className="bg-zinc-900 p-4 border border-white/10 text-white outline-none focus:border-white transition-colors"
                required
            />

            <div className="relative">
                <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-zinc-900 p-4 border border-white/10 text-white outline-none focus:border-white transition-colors appearance-none cursor-pointer"
                    required
                >
                    <option value="" disabled>Selecione a categoria</option>
                    {CATEGORIES.filter(c => c !== "TODOS").map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </div>
            </div>
        </div>

        <textarea
            name="description"
            rows={4}
            placeholder="Descrição Geral"
            value={formData.description}
            onChange={handleChange}
            className="w-full bg-zinc-900 p-4 border border-white/10 text-white outline-none focus:border-white resize-none transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-6">

        <div 
            onClick={() => handleToggle('isActive')}
            className={`
                border p-4 rounded cursor-pointer transition-all flex items-center justify-between group select-none
                ${formData.isActive ? 'border-green-500/50 bg-green-500/10' : 'border-white/10 bg-zinc-900'}
            `}
        >
            <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full transition-all ${formData.isActive ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-zinc-600'}`}></div>
                <div>
                    <span className="block text-xs uppercase font-bold tracking-widest text-white">
                        {formData.isActive ? 'Produto Ativo' : 'Rascunho'}
                    </span>
                    <span className="text-[10px] text-white/50">
                        {formData.isActive ? 'Visível na loja' : 'Oculto do cliente'}
                    </span>
                </div>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.isActive ? 'bg-green-500' : 'bg-zinc-700'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isActive ? 'left-6' : 'left-1'}`} />
            </div>
        </div>

        <div 
            onClick={() => handleToggle('isFeatured')}
            className={`
                border p-4 rounded cursor-pointer transition-all flex items-center justify-between group select-none
                ${formData.isFeatured ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-white/10 bg-zinc-900'}
            `}
        >
            <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full flex items-center justify-center`}>
                    {formData.isFeatured ? '⭐' : '☆'}
                </div>
                <div>
                    <span className="block text-xs uppercase font-bold tracking-widest text-white">
                        {formData.isFeatured ? 'Destaque' : 'Padrão'}
                    </span>
                    <span className="text-[10px] text-white/50">
                        {formData.isFeatured ? 'Prioridade no site' : 'Listagem normal'}
                    </span>
                </div>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.isFeatured ? 'bg-yellow-500' : 'bg-zinc-700'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isFeatured ? 'left-6' : 'left-1'}`} />
            </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-white/10 pt-6">
        <label className="text-xs uppercase tracking-widest text-white/50">Destaques</label>
        
        <div className="flex gap-2">
            <input 
                value={newFeature}
                onChange={e => setNewFeature(e.target.value)}
                placeholder="Ex: Aba Curva, Bordado 3D..."
                className="flex-1 bg-zinc-900 p-3 border border-white/10 text-white text-sm outline-none focus:border-white"
                onKeyDown={(e) => e.key === 'Enter' && addFeature(e)}
            />
            <button 
                type="button" 
                onClick={addFeature}
                className="bg-white text-black px-6 font-bold uppercase text-xs tracking-widest hover:bg-zinc-200 transition-colors"
            >
                Add
            </button>
        </div>

        <ul className="space-y-2">
            {formData.features.map((feat, index) => (
                <li key={index} className="flex items-center justify-between bg-zinc-900/50 p-3 border border-white/5 rounded">
                    <span className="text-sm text-white/80">• {feat}</span>
                    <button 
                        type="button" 
                        onClick={() => removeFeature(index)}
                        className="text-red-500 hover:text-red-400 text-xs uppercase font-bold tracking-wider"
                    >
                        Remover
                    </button>
                </li>
            ))}
        </ul>
      </div>

      <div className="space-y-3 border-t border-white/10 pt-6">
        <label className="text-xs uppercase tracking-widest text-white/50">Tamanhos Disponíveis</label>
        <div className="flex flex-wrap gap-3">
            {AVAILABLE_SIZES.map(size => {
                const isSelected = formData.sizes.includes(size)
                return (
                    <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`
                            w-12 h-12 flex items-center justify-center border font-bold text-sm transition-all
                            ${isSelected 
                                ? 'bg-white text-black border-white' 
                                : 'bg-transparent text-white border-white/20 hover:border-white/50'}
                        `}
                    >
                        {size}
                    </button>
                )
            })}
        </div>
      </div>

      <div className="space-y-3 border-t border-white/10 pt-6 pb-6">
        <label className="text-xs uppercase tracking-widest text-white/50">Cores / Variações</label>

        <div className="flex gap-2 items-stretch h-12">
            <div className="relative aspect-square h-full overflow-hidden border border-white/20 rounded cursor-pointer group">
                <input 
                    type="color" 
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0"
                />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/10 group-hover:bg-transparent">
                      <span className="text-[10px] bg-black/50 text-white px-1 rounded backdrop-blur-sm">COR</span>
                </div>
            </div>
            
            <input 
                type="text"
                placeholder="Nome da Cor (Ex: Verde Militar)"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                className="flex-1 bg-zinc-900 px-4 border border-white/10 text-white text-sm outline-none focus:border-white"
                onKeyDown={(e) => e.key === 'Enter' && addColor(e)}
            />
            
            <button 
                type="button"
                onClick={addColor}
                className="bg-white text-black px-6 font-bold uppercase text-xs tracking-widest hover:bg-zinc-200 transition-colors"
            >
                Add
            </button>
        </div>

        <div className="flex flex-wrap gap-4 mt-4">
            {formData.colors.map((color, index) => (
                <div key={index} className="flex items-center gap-3 bg-zinc-900 border border-white/10 pl-2 pr-4 py-2 rounded-full">
                    <div 
                        className="w-4 h-4 rounded-full shadow-sm border border-white/20" 
                        style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-xs text-white uppercase tracking-wider">{color.name}</span>
                    <button 
                        type="button"
                        onClick={() => removeColor(index)}
                        className="text-white/30 hover:text-red-500 ml-2 transition-colors"
                    >
                        ✕
                    </button>
                </div>
            ))}
            {formData.colors.length === 0 && (
                <span className="text-white/30 text-sm italic">Nenhuma cor adicionada.</span>
            )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black font-black uppercase py-5 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50 tracking-[0.25em] mt-4"
      >
        {loading ? 'Salvando...' : 'Salvar Produto'}
      </button>
    </form>
  )
}