package com.smartforensic.agent.service

import android.content.Context
import com.smartforensic.agent.collectors.ContactsCollector
import com.smartforensic.agent.collectors.SmsCollector
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json

class ForensicServer(
    private val context: Context,
    private val port: Int = 47822
) {
    private var engine: NettyApplicationEngine? = null
    var isRunning = false
        private set

    var isCollectionAllowed = true

    private val contactsCollector = ContactsCollector(context)
    private val smsCollector = SmsCollector(context)

    fun start() {
        if (isRunning) return

        CoroutineScope(Dispatchers.IO).launch {
            try {
                engine = embeddedServer(Netty, port = port, host = "127.0.0.1") {
                    install(ContentNegotiation) {
                        json(Json {
                            prettyPrint = true
                            isLenient = true
                            ignoreUnknownKeys = true
                        })
                    }

                    routing {
                        get("/api/companion/status") {
                            call.respond(
                                mapOf(
                                    "status" to "ONLINE",
                                    "collectionAllowed" to isCollectionAllowed,
                                    "packageName" to context.packageName,
                                    "androidVersion" to android.os.Build.VERSION.RELEASE
                                )
                            )
                        }

                        get("/api/companion/contacts") {
                            if (!isCollectionAllowed) {
                                call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Collection halted by device owner"))
                                return@get
                            }
                            val contacts = contactsCollector.collectContacts()
                            call.respond(mapOf("contacts" to contacts))
                        }

                        get("/api/companion/sms") {
                            if (!isCollectionAllowed) {
                                call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Collection halted by device owner"))
                                return@get
                            }
                            val sms = smsCollector.collectSms()
                            call.respond(mapOf("sms" to sms))
                        }
                    }
                }.start(wait = false)
                isRunning = true
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun stop() {
        engine?.stop(1000, 2000)
        engine = null
        isRunning = false
    }
}
