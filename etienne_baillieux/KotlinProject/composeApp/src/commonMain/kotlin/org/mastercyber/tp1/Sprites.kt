package org.mastercyber.tp1

import kotlinx.serialization.Serializable

@Serializable
data class Sprites(
    val regular: String? = null,
    val shiny : String? = null,
    val qmax: String? = null
)
