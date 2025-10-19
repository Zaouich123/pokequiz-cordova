package org.mastercyber.tp1

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json


class Greeting {
    private val platform = getPlatform()

    fun greet(): String {
        return "Hello, ${platform.name}!"
    }
    private val client = HttpClient {
        install(ContentNegotiation) {
            json(Json {
                prettyPrint = true
                isLenient = true
                ignoreUnknownKeys = true
            })
        }
    }
    suspend fun fetchPokemon(): String? {
        val random = (1..1025).random()
        val response: Pokemon =
            client.get("https://tyradex.vercel.app/api/v1/pokemon/$random").body()
        client.close()
        return response.name?.fr ?: "Unknown"
    }

    suspend fun fetchPokemonImage(url: String): ByteArray? {
        return try {
            val response: ByteArray = client.get(url).body()
            client.close()
            response
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }


}