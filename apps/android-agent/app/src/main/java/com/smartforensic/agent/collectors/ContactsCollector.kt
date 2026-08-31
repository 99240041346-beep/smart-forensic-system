package com.smartforensic.agent.collectors

import android.content.Context
import android.database.Cursor
import android.provider.ContactsContract
import kotlinx.serialization.Serializable

@Serializable
data class ContactPhone(val number: String, val type: String)

@Serializable
data class ContactEmail(val email: String, val type: String)

@Serializable
data class AuthorizedContact(
    val id: String,
    val name: String,
    val phoneNumbers: List<ContactPhone>,
    val emails: List<ContactEmail>,
    val source: String,
    val isDuplicate: Boolean = false
)

class ContactsCollector(private val context: Context) {

    fun collectContacts(): List<AuthorizedContact> {
        val contactsList = mutableListOf<AuthorizedContact>()
        val contentResolver = context.contentResolver

        val cursor: Cursor? = contentResolver.query(
            ContactsContract.Contacts.CONTENT_URI,
            null,
            null,
            null,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC"
        )

        cursor?.use { c ->
            val idIndex = c.getColumnIndex(ContactsContract.Contacts._ID)
            val nameIndex = c.getColumnIndex(ContactsContract.Contacts.DISPLAY_NAME)
            val hasPhoneIndex = c.getColumnIndex(ContactsContract.Contacts.HAS_PHONE_NUMBER)

            val seenNames = mutableSetOf<String>()

            while (c.moveToNext()) {
                val id = if (idIndex != -1) c.getString(idIndex) else ""
                val name = if (nameIndex != -1) c.getString(nameIndex) ?: "Unnamed" else "Unnamed"
                val hasPhone = if (hasPhoneIndex != -1) c.getInt(hasPhoneIndex) > 0 else false

                val phones = mutableListOf<ContactPhone>()
                if (hasPhone) {
                    val pCursor = contentResolver.query(
                        ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                        null,
                        ContactsContract.CommonDataKinds.Phone.CONTACT_ID + " = ?",
                        arrayOf(id),
                        null
                    )
                    pCursor?.use { pc ->
                        val pNumIndex = pc.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
                        val pTypeIndex = pc.getColumnIndex(ContactsContract.CommonDataKinds.Phone.TYPE)
                        while (pc.moveToNext()) {
                            val num = if (pNumIndex != -1) pc.getString(pNumIndex) else ""
                            val typeInt = if (pTypeIndex != -1) pc.getInt(pTypeIndex) else ContactsContract.CommonDataKinds.Phone.TYPE_MOBILE
                            val typeStr = when (typeInt) {
                                ContactsContract.CommonDataKinds.Phone.TYPE_WORK -> "Work"
                                ContactsContract.CommonDataKinds.Phone.TYPE_HOME -> "Home"
                                else -> "Mobile"
                            }
                            if (num.isNotBlank()) phones.add(ContactPhone(num, typeStr))
                        }
                    }
                }

                val isDup = seenNames.contains(name.lowercase())
                seenNames.add(name.lowercase())

                contactsList.add(
                    AuthorizedContact(
                        id = id,
                        name = name,
                        phoneNumbers = phones,
                        emails = emptyList(),
                        source = "Device Contacts",
                        isDuplicate = isDup
                    )
                )
            }
        }

        return contactsList
    }
}
