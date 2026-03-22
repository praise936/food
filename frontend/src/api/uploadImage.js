
import { supabase } from "../../supabase"

export const uploadImage = async (file) => {
    if (!file) return null

    const fileName = `${Date.now()}-${file.name}`

    const { error } = await supabase.storage
        .from("mood-images")
        .upload(fileName, file)

    if (error) {
        console.error("Upload error:", error.message)
        return null
    }

    const { data } = supabase.storage
        .from("mood-images")
        .getPublicUrl(fileName)

    return data.publicUrl
}