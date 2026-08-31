package com.smartforensic.agent.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    isServerRunning: Boolean,
    isCollectionAllowed: Boolean,
    contactsPermissionGranted: Boolean,
    smsPermissionGranted: Boolean,
    onRequestPermissions: () -> Unit,
    onToggleEmergencyStop: (Boolean) -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Smart Forensic Agent", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Status Card
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = if (isServerRunning && isCollectionAllowed) Color(0xFF1E3A2F) else Color(0xFF3A1E1E)
                ),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(
                        imageVector = if (isServerRunning && isCollectionAllowed) Icons.Default.CheckCircle else Icons.Default.Warning,
                        contentDescription = null,
                        tint = if (isServerRunning && isCollectionAllowed) Color(0xFF4ADE80) else Color(0xFFF87171)
                    )
                    Column {
                        Text(
                            text = if (isCollectionAllowed) "AGENT ACTIVE & READY" else "COLLECTION HALTED BY USER",
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "Port 47822 • Local ADB Loopback Only",
                            fontSize = 12.sp,
                            color = Color.LightGray
                        )
                    }
                }
            }

            // Consent Notice
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Investigator Authorization Notice", fontWeight = FontWeight.Bold)
                    Text(
                        "This device is participating in an authorized forensic analysis. Data access requires explicit runtime permissions and is restricted to the local USB/ADB connection.",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Permissions Checklist
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Permission Status", fontWeight = FontWeight.Bold)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Contacts Access")
                        Text(
                            text = if (contactsPermissionGranted) "GRANTED" else "DENIED",
                            fontWeight = FontWeight.SemiBold,
                            color = if (contactsPermissionGranted) Color(0xFF22C55E) else Color(0xFFEF4444)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("SMS Access")
                        Text(
                            text = if (smsPermissionGranted) "GRANTED" else "DENIED",
                            fontWeight = FontWeight.SemiBold,
                            color = if (smsPermissionGranted) Color(0xFF22C55E) else Color(0xFFEF4444)
                        )
                    }

                    if (!contactsPermissionGranted || !smsPermissionGranted) {
                        Button(
                            onClick = onRequestPermissions,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Grant Required Permissions")
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // Emergency Stop Button
            Button(
                onClick = { onToggleEmergencyStop(!isCollectionAllowed) },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isCollectionAllowed) Color(0xFFDC2626) else Color(0xFF16A34A)
                ),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
            ) {
                Icon(
                    imageVector = if (isCollectionAllowed) Icons.Default.Block else Icons.Default.PlayArrow,
                    contentDescription = null
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (isCollectionAllowed) "EMERGENCY STOP COLLECTION" else "RESUME AUTHORIZED COLLECTION",
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
