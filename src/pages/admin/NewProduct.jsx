import { useState } from 'react'
import { db } from '../../services/firebaseConnection'
import { addDoc, collection } from 'firebase/firestore'
import { uploadImageToCloudinary } from '../../services/uploadImage'
import { Link } from 'react-router-dom'
import { CATEGORIES } from '../../data/constants'

export default function NewProduct() {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState(CATEGORIES[1])
  const [description, setDescription] = useState('')

  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  function handleFile(e) {
    if(e.target.files[0]) {
        const image = e.target.files[0]
        if(image.type === 'image/jpeg' || image.type === 'image/png') {
            setImageFile(image)
            setPreview(URL.createObjectURL(image))
        } else {
            alert("Envie uma imagem PNG ou JPEG")
        }
    }
  }

  async function handleRegister(e) {
    e.preventDefault()

    if(!name || !price || !imageFile) {
        alert("Preencha todos os campos e envie uma imagem!")
        return
    }

    setUploading(true)

    try {
        const imageUrl = await uploadImageToCloudinary(imageFile)
        
        if(!imageUrl) {
            throw new Error("Falha ao subir imagem")
        }

        await addDoc(collection(db, "products"), {
            name: name,
            price: Number(price),
            category: category,
            description: description,
            img: imageUrl,
            gallery: [imageUrl],
            sizes: ["P", "M", "G", "GG"],
            created_at: new Date()
        })

        alert("PRODUTO CADASTRADO COM SUCESSO! 🚀")
        setName('')
        setPrice('')
        setDescription('')
        setImageFile(null)
        setPreview(null)

    } catch(error) {
        console.log(error)
        alert("Erro ao cadastrar. Veja o console.")
    } finally {
        setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20">
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/admin/dashboard" className="text-white/50 hover:text-white">← Voltar</Link>
                <h1 className="text-2xl font-black uppercase italic tracking-tighter">Novo Produto</h1>
            </div>

            <form onSubmit={handleRegister} className="flex flex-col gap-6">

                <label className="w-full h-64 bg-zinc-900 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-white hover:bg-zinc-800 transition-all overflow-hidden relative">
                    <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                    
                    {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center text-white/50">
                            <span className="text-4xl block mb-2">📷</span>
                            <span className="text-xs uppercase tracking-widest">Clique para adicionar foto</span>
                        </div>
                    )}
                </label>

                <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/50 mb-1 block">Nome do Produto</label>
                    <input 
                        type="text" 
                        value={name} onChange={(e) => setName(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 p-3 text-white focus:border-white outline-none"
                        placeholder="Ex: T-Shirt Boxy Logo"
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
                            placeholder="149.90"
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
                        rows={4}
                        value={description} onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 p-3 text-white focus:border-white outline-none resize-none"
                        placeholder="Descreva os detalhes da peça..."
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={uploading}
                    className="bg-white text-black font-black uppercase tracking-[0.2em] py-4 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploading ? 'Salvando...' : 'Cadastrar Produto'}
                </button>

            </form>
        </div>
    </div>
  )
}