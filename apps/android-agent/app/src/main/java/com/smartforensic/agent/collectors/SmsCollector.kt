package com.smartforensic.agent.collectors

import android.content.Context
import android.database.Cursor
import android.net.Uri
import kotlinx.serialization.Serializable

@Serializable
data class AuthorizedSms(
    val id: String,
    val address: String,
    val date: String,
    val type: String,
    val body: String
)

class SmsCollector(private val context: Context) {

    fun collectSms(limit: Int = 100): List<AuthorizedSms> {
        val smsList = mutableListOf<AuthorizedSms>()
        val uri = Uri.parse("content://sms")
        val cursor: Cursor? = context.contentResolver.query(
            uri,
            arrayOf("_id", "address", "date", "type", "body"),
            null,
            null,
            "date DESC LIMIT $limit"
        )

        cursor?.use { c ->
            val idIndex = c.getColumnIndex("_id")
            val addrIndex = c.getColumnIndex("address")
            val dateIndex = c.getColumnIndex("date")
            val typeIndex = c.getColumnIndex("type")
            val bodyIndex = c.getColumnIndex("body")

            while (c.moveToNext()) {
                val id = if (idIndex != -1) c.getString(idIndex) else ""
                val address = if (addrIndex != -1) c.getString(addrIndex) ?: "Unknown" else "Unknown"
                val dateMillis = if (dateIndex != -1) c.getLong(dateIndex) else 0L
                val typeCode = if (typeIndex != -1) c.getInt(typeIndex) else 1
                val body = if (bodyIndex != -1) c.getString(bodyIndex) ?: "" else ""

                val typeStr = when (typeCode) {
                    1 -> "INBOX"
                    2 -> "SENT"
                    3 -> "DRAFT"
                    else -> "INBOX"
                }

                val dateFormatted = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.US)
                    .format(java.util.Date(dateMillis))

                smsList.add(
                    AuthorizedSms(
                        id = id,
                        address = address,
                        date = dateFormatted,
                        type = typeStr,
                        body = body
                    )
                )
            }
        }

        return smsList
    }
}
