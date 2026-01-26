import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { db } from '../../services/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { uploadImageToCloudinary } from '../../services/cloudinary'
import { CATEGORIES } from '../../data/constants'

export default function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')

  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [oldImageUrl, setOldImageUrl] = useState(null)

  useEffect(() => {
    async function loadProduct() {
        try {
            const docRef = doc(db, "products", id)
            const snapshot = await getDoc(docRef)

            if(!snapshot.exists()) {
                alert("Produto não encontrado")
                navigate('/admin/dashboard')
                return
            }

            const data = snapshot.data()
            setName(data.name)
            setPrice(data.price)
            setCategory(data.category)
            setDescription(data.description)
            setPreview(data.img)
            setOldImageUrl(data.img)

        } catch(err) {
            console.log(err)
        } finally {
            setLoading(false)
        }
    }

    loadProduct()
  }, [id, navigate])

  function handleFile(e) {
    if(e.target.files[0]) {
        const image = e.target.files[0]
        if(image.type === 'image/jpeg' || image.type === 'image/png' || image.type === 'image/webp') {
            setImageFile(image)
            setPreview(URL.createObjectURL(image))
        } else {
            alert("Envie uma imagem PNG, JPEG ou WEBP")
        }
    }
  }

  async function handleUpdate(e) {
    e.preventDefault()
    setUpdating(true)

    try {
        let urlToSave = oldImageUrl

        if(imageFile) {
            const newUrl = await uploadImageToCloudinary(imageFile)
            if(newUrl) {
                urlToSave = newUrl
            } else {
                alert("Erro ao subir a nova imagem. Tente novamente.")
                setUpdating(false)
                return
            }
        }

        const docRef = doc(db, "products", id)

        await updateDoc(docRef, {
            name: name,
            price: Number(price),
            category: category,
            description: description,
            img: urlToSave
        })

        alert("PRODUTO ATUALIZADO COM SUCESSO!")
        navigate('/admin/dashboard')

    } catch(error) {
        console.log(error)
        alert("Erro ao atualizar.")
    } finally {
        setUpdating(false)
    }
  }

  if(loading) {
      return <div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando dados...</div>
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20">
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/admin/dashboard" className="text-white/50 hover:text-white">← Voltar</Link>
                <h1 className="text-2xl font-black uppercase italic tracking-tighter">Editar Produto</h1>
            </div>

            <form onSubmit={handleUpdate} className="flex flex-col gap-6">

                <label className="w-full h-64 bg-zinc-900 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-white hover:bg-zinc-800 transition-all overflow-hidden relative group">
                    <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                    
                    {preview ? (
                        <>
                            <img src={preview} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-widest text-xs">
                                Clique para alterar
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-white/50">
                            <span className="text-4xl block mb-2">📷</span>
                            <span className="text-xs uppercase tracking-widest">Adicionar foto</span>
                        </div>
                    )}
                </label>

                <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/50 mb-1 block">Nome do Produto</label>
                    <input 
                        type="text" 
                        value={name} onChange={(e) => setName(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 p-3 text-white focus:border-white outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/50 mb-1 block">Preço (R$)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={price} onChange={(e) => setPrice(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 p-3 text-white focus:border-white outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/50 mb-1 block">Categoria</label>
                        <select 
                            value={category} onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 p-3 text-white focus:border-white outline-none"
                        >
                            {CATEGORIES.filter(c => c !== "TODOS").map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/50 mb-1 block">Descrição</label>
                    <textarea 
                        rows={6}
                        value={description} onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 p-3 text-white focus:border-white outline-none resize-none"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={updating}
                    className="bg-blue-600 text-white font-black uppercase tracking-[0.2em] py-4 hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {updating ? 'Salvando...' : 'Salvar Alterações'}
                </button>

            </form>
        </div>
    </div>
  )
}