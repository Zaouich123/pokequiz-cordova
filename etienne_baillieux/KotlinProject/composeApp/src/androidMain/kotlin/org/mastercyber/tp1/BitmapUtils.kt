package org.mastercyber.tp1

import android.graphics.Bitmap
import android.graphics.BitmapFactory

class BitmapUtils {
    fun byteArrayToBitmap(bytes: ByteArray?): Bitmap? {
        return if (bytes != null) BitmapFactory.decodeByteArray(bytes, 0, bytes.size) else null
    }

    fun convertToGrayscale(bitmap: Bitmap): Bitmap {
        val width = bitmap.width
        val height = bitmap.height
        val bmpGrayscale = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)

        for (x in 0 until width) {
            for (y in 0 until height) {
                val pixel = bitmap.getPixel(x, y)
                val r = (pixel shr 16) and 0xFF
                val g = (pixel shr 8) and 0xFF
                val b = pixel and 0xFF
                val gray = (0.3*r + 0.59*g + 0.11*b).toInt()
                val newPixel = (0xFF shl 24) or (gray shl 16) or (gray shl 8) or gray
                bmpGrayscale.setPixel(x, y, newPixel)
            }
        }

        return bmpGrayscale
    }
}