package com.smartforensic.agent

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.*
import androidx.core.content.ContextCompat
import com.smartforensic.agent.service.ForensicServer
import com.smartforensic.agent.ui.DashboardScreen

class MainActivity : ComponentActivity() {

    private lateinit var forensicServer: ForensicServer

    private var contactsGranted by mutableStateOf(false)
    private var smsGranted by mutableStateOf(false)
    private var isCollectionAllowed by mutableStateOf(true)
    private var isServerRunning by mutableStateOf(false)

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        contactsGranted = permissions[Manifest.permission.READ_CONTACTS] == true
        smsGranted = permissions[Manifest.permission.READ_SMS] == true
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        checkCurrentPermissions()

        forensicServer = ForensicServer(this)
        forensicServer.start()
        isServerRunning = forensicServer.isRunning

        setContent {
            DashboardScreen(
                isServerRunning = isServerRunning,
                isCollectionAllowed = isCollectionAllowed,
                contactsPermissionGranted = contactsGranted,
                smsPermissionGranted = smsGranted,
                onRequestPermissions = { requestRequiredPermissions() },
                onToggleEmergencyStop = { allowed ->
                    isCollectionAllowed = allowed
                    forensicServer.isCollectionAllowed = allowed
                }
            )
        }
    }

    private fun checkCurrentPermissions() {
        contactsGranted = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.READ_CONTACTS
        ) == PackageManager.PERMISSION_GRANTED

        smsGranted = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.READ_SMS
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestRequiredPermissions() {
        permissionLauncher.launch(
            arrayOf(
                Manifest.permission.READ_CONTACTS,
                Manifest.permission.READ_SMS
            )
        )
    }

    override fun onDestroy() {
        super.onDestroy()
        forensicServer.stop()
    }
}
