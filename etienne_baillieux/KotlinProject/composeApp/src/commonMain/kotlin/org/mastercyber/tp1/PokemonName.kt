package org.mastercyber.tp1

import kotlinx.serialization.Serializable

@Serializable
data class PokemonName(
    var fr: String? = null,
    var en: String? = null,
    val jp: String? = null
)
