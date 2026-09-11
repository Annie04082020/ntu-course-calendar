package tw.edu.ntu.coursecalendar

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tw.edu.ntu.coursecalendar.data.Course
import tw.edu.ntu.coursecalendar.data.CourseRepository
import tw.edu.ntu.coursecalendar.ui.theme.NTUCourseCalendarTheme
import java.net.URLDecoder

class MainActivity : ComponentActivity() {
    private lateinit var repo: CourseRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        repo = CourseRepository(this)

        handleIntent(intent)

        setContent {
            NTUCourseCalendarTheme {
                MainScreen(
                    repo = repo,
                    onOpenWebsite = {
                        val browserIntent = Intent(
                            Intent.ACTION_VIEW,
                            Uri.parse("https://annie04082020.github.io/ntu-course-calendar/")
                        )
                        startActivity(browserIntent)
                    }
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        val data: Uri? = intent?.data
        if (data != null) {
            var jsonString: String? = null
            if (data.scheme == "ntucourse" && data.host == "import") {
                jsonString = data.getQueryParameter("data")
            } else if (data.host == "annie04082020.github.io") {
                jsonString = data.getQueryParameter("data")
            }

            if (!jsonString.isNullOrBlank()) {
                try {
                    val decoded = URLDecoder.decode(jsonString, "UTF-8")
                    if (repo.saveCoursesFromJson(decoded)) {
                        Toast.makeText(this, "🎉 成功從網頁同步您的課表！", Toast.LENGTH_LONG).show()
                    } else {
                        Toast.makeText(this, "⚠️ 課表資料格式有誤", Toast.LENGTH_SHORT).show()
                    }
                } catch (e: Exception) {
                    Toast.makeText(this, "⚠️ 解析同步資料失敗", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    repo: CourseRepository,
    onOpenWebsite: () -> Unit
) {
    var courses by remember { mutableStateOf(repo.getCourses()) }
    var isDemo by remember { mutableStateOf(repo.isUsingDemo()) }
    var showImportDialog by remember { mutableStateOf(false) }
    var importText by remember { mutableStateOf("") }
    val clipboardManager = LocalClipboardManager.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("臺大課表好朋友", fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.width(8.dp))
                        SuggestionChip(
                            onClick = {},
                            label = { Text(if (isDemo) "示範模式" else "個人課表", fontSize = 11.sp) }
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // 操作按鈕列
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { showImportDialog = true },
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("貼上匯入")
                    }

                    OutlinedButton(
                        onClick = onOpenWebsite,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("開啟課程網頁")
                    }
                }
            }

            if (!isDemo) {
                item {
                    TextButton(
                        onClick = {
                            repo.clearUserData()
                            courses = repo.getCourses()
                            isDemo = repo.isUsingDemo()
                        },
                        colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                    ) {
                        Icon(Icons.Default.Clear, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("清除個人資料並恢復為示範模式")
                    }
                }
            }

            // 小工具教學說明卡片
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                    )
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Info, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("如何新增桌面小工具？", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            "1. 回到手機 / 平板桌面，長按空白處。\n" +
                                    "2. 點選「微件 / 小工具」並搜尋「臺大課表好朋友」。\n" +
                                    "3. 選擇【2D 週課表矩陣】或【今日焦點】，拖曳至桌面即可！\n" +
                                    "4. 支援任意調整尺寸大小以適配您的桌面版面。",
                            fontSize = 12.5.sp,
                            lineHeight = 18.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // 課程列表標題
            item {
                Text(
                    "已載入課程清單 (${courses.size} 門課)",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            // 課程卡片
            items(courses) { course ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = course.name,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                modifier = Modifier.weight(1f)
                            )
                            Badge(
                                containerColor = if (course.isEnrolled) Color(0xFF10B981) else Color(0xFFF59E0B)
                            ) {
                                Text(
                                    if (course.isEnrolled) "正選" else "候補",
                                    color = Color.White,
                                    fontSize = 10.sp,
                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        val loc = course.locations?.joinToString("、") ?: "未註明地點"
                        Text(
                            text = "📍 $loc ${if (!course.instructor.isNullOrBlank()) "· ${course.instructor}" else ""}",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        val timeSlots = course.timeSlots?.joinToString("，") ?: "未排定時間"
                        Text(
                            text = "⏰ $timeSlots",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }
    }

    // 手動匯入代碼彈窗
    if (showImportDialog) {
        AlertDialog(
            onDismissRequest = { showImportDialog = false },
            title = { Text("貼上課表代碼") },
            text = {
                Column {
                    Text(
                        "請貼上從「臺大課程日曆好朋友」網頁複製的 JSON 課表代碼：",
                        fontSize = 12.5.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = importText,
                        onValueChange = { importText = it },
                        modifier = Modifier.fillMaxWidth().height(140.dp),
                        placeholder = { Text("在此貼上 JSON 代碼...") }
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    TextButton(
                        onClick = {
                            val clip = clipboardManager.getText()
                            if (clip != null) {
                                importText = clip.text
                            }
                        }
                    ) {
                        Text("讀取剪貼簿貼上")
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (repo.saveCoursesFromJson(importText)) {
                            courses = repo.getCourses()
                            isDemo = repo.isUsingDemo()
                            showImportDialog = false
                            importText = ""
                        }
                    }
                ) {
                    Text("確認匯入")
                }
            },
            dismissButton = {
                TextButton(onClick = { showImportDialog = false }) {
                    Text("取消")
                }
            }
        )
    }
}
