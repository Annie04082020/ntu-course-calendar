package tw.edu.ntu.coursecalendar

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tw.edu.ntu.coursecalendar.data.Course
import tw.edu.ntu.coursecalendar.data.CourseParser
import tw.edu.ntu.coursecalendar.data.CourseRepository
import tw.edu.ntu.coursecalendar.data.NTUPeriods
import tw.edu.ntu.coursecalendar.ui.theme.NTUCourseCalendarTheme
import tw.edu.ntu.coursecalendar.widget.WidgetColors
import java.net.URLDecoder
import java.util.*

class MainActivity : ComponentActivity() {
    private lateinit var repo: CourseRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        repo = CourseRepository(this)
        repo.triggerWidgetUpdate()

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
    var selectedTab by remember { mutableStateOf(0) }
    var showImportDialog by remember { mutableStateOf(false) }
    var selectedCourseDetail by remember { mutableStateOf<Course?>(null) }
    var importText by remember { mutableStateOf("") }
    val clipboardManager = LocalClipboardManager.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("臺大課表好朋友", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        ) {
                            Text(
                                text = if (isDemo) "示範模式" else "個人課表",
                                fontSize = 11.sp,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // 操作快捷按鈕
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = { showImportDialog = true },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("➕ 貼上匯入代碼")
                }

                OutlinedButton(
                    onClick = onOpenWebsite,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("🌐 開啟課程網頁")
                }
            }

            // 模式切換分頁
            TabRow(
                selectedTabIndex = selectedTab,
                modifier = Modifier.fillMaxWidth()
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("📅 2D 週功課表", fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Normal) }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("📋 課程清單與設定", fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Normal) }
                )
            }

            if (selectedTab == 0) {
                // 2D 週功課表矩陣畫面 (左時間、上星期、中間排課)
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(12.dp)
                ) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        ),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        WeeklyTimetableMatrix(
                            courses = courses,
                            onCourseClick = { selectedCourseDetail = it }
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // 桌面小工具教學卡片
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("💡", fontSize = 16.sp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                "長按手機桌面空白處 ➔ 點選「微件 / 小工具」➔ 搜尋「臺大課表好朋友」，即可將 2D 週功課表新增至桌面！",
                                fontSize = 12.sp,
                                lineHeight = 16.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            } else {
                // 課程清單與設定畫面
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
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
                                Text("🗑️ 清除個人資料並恢復為示範模式")
                            }
                        }
                    }

                    item {
                        Text(
                            "已載入課程 (${courses.size} 門課)",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            modifier = Modifier.padding(top = 4.dp, bottom = 4.dp)
                        )
                    }

                    items(courses) { course ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { selectedCourseDetail = course },
                            shape = RoundedCornerShape(10.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surface
                            ),
                            elevation = CardDefaults.cardElevation(defaultElevation = 1.5.dp)
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
                                    Box(
                                        modifier = Modifier
                                            .background(
                                                if (course.isEnrolled) Color(0xFF10B981) else Color(0xFFF59E0B),
                                                RoundedCornerShape(4.dp)
                                            )
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = if (course.isEnrolled) "正選" else "候補",
                                            color = Color.White,
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(4.dp))

                                val loc = course.locations?.joinToString("、") ?: "未註明地點"
                                val teacher = if (course.instructor.isNullOrBlank()) "" else " · " + course.instructor
                                Text(
                                    text = "📍 " + loc + teacher,
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
        }
    }

    // 課程詳細資訊彈窗
    selectedCourseDetail?.let { course ->
        AlertDialog(
            onDismissRequest = { selectedCourseDetail = null },
            title = {
                Text(course.name, fontWeight = FontWeight.Bold, fontSize = 17.sp)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("👨‍🏫 授課教師：${course.instructor ?: "未註明"}", fontSize = 14.sp)
                    Text("📍 教室地點：${course.locations?.joinToString("、") ?: "依系所公告"}", fontSize = 14.sp)
                    Text("⏰ 上課節次：${course.timeSlots?.joinToString("，") ?: "未排定"}", fontSize = 14.sp)
                    val enrolledText = if (course.isEnrolled) "正選" else "候補"
                    Text("📌 選課狀態：" + enrolledText, fontSize = 14.sp)
                }
            },
            confirmButton = {
                Button(onClick = { selectedCourseDetail = null }) {
                    Text("關閉")
                }
            }
        )
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

/**
 * 2D 功課表矩陣 (左側時間軸、上方星期 MON~FRI、跨節彩色課程卡片)
 */
@Composable
fun WeeklyTimetableMatrix(
    courses: List<Course>,
    onCourseClick: (Course) -> Unit
) {
    val weekSchedule = remember(courses) { CourseParser.buildWeekSchedule(courses) }

    // 當前星期
    val calendar = Calendar.getInstance()
    val currentWeekday = when (calendar.get(Calendar.DAY_OF_WEEK)) {
        Calendar.MONDAY -> "一"
        Calendar.TUESDAY -> "二"
        Calendar.WEDNESDAY -> "三"
        Calendar.THURSDAY -> "四"
        Calendar.FRIDAY -> "五"
        Calendar.SATURDAY -> "六"
        else -> "日"
    }

    // 計算課表節次範圍 (最少 1~8 節 08:10~16:20)
    val allUsedIndices = mutableListOf<Int>()
    weekSchedule.values.forEach { list ->
        list.forEach { c ->
            val sIdx = NTUPeriods.ORDER.indexOf(c.firstPeriod)
            val eIdx = NTUPeriods.ORDER.indexOf(c.lastPeriod)
            if (sIdx != -1 && eIdx != -1) {
                for (i in sIdx..eIdx) allUsedIndices.add(i)
            }
        }
    }
    var minPIdx = NTUPeriods.ORDER.indexOf("1")
    var maxPIdx = NTUPeriods.ORDER.indexOf("8")
    if (allUsedIndices.isNotEmpty()) {
        val dMin = allUsedIndices.minOrNull() ?: minPIdx
        val dMax = allUsedIndices.maxOrNull() ?: maxPIdx
        if (dMin < minPIdx) minPIdx = dMin
        if (dMax > maxPIdx) maxPIdx = dMax
    }
    val displayPeriods = NTUPeriods.ORDER.subList(minPIdx, maxPIdx + 1)

    val hasWeekend = (weekSchedule["六"]?.isNotEmpty() == true) || (weekSchedule["日"]?.isNotEmpty() == true)
    val schoolDays = if (hasWeekend) listOf("一", "二", "三", "四", "五", "六") else listOf("一", "二", "三", "四", "五")

    val rowHeight = 48.dp
    val gap = 3.dp
    val headerRowHeight = 28.dp
    val timeColWidth = 42.dp
    val dayColWidth = 66.dp

    val hScrollState = rememberScrollState()
    val vScrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(6.dp)
            .verticalScroll(vScrollState)
            .horizontalScroll(hScrollState)
    ) {
        // 頂部星期標題列
        Row(modifier = Modifier.padding(bottom = gap)) {
            // 左上角時間軸標題
            Box(
                modifier = Modifier
                    .width(timeColWidth)
                    .height(headerRowHeight),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "節次",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.width(gap))

            // 星期各欄 (MON ~ FRI)
            schoolDays.forEach { day ->
                val isToday = (day == currentWeekday)
                val enDay = NTUPeriods.WEEKDAYS_EN[day] ?: day

                Box(
                    modifier = Modifier
                        .width(dayColWidth)
                        .height(headerRowHeight)
                        .background(
                            if (isToday) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                            RoundedCornerShape(6.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (isToday) "$enDay ●" else enDay,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isToday) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Spacer(modifier = Modifier.width(gap))
            }
        }

        // 功課表格子內容 (時間軸 + 每日欄)
        Row {
            // 左側時間軸 (Time Column)
            Column(
                modifier = Modifier.width(timeColWidth),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                displayPeriods.forEachIndexed { idx, p ->
                    val def = NTUPeriods.DEFS[p]
                    Column(
                        modifier = Modifier
                            .width(timeColWidth)
                            .height(rowHeight)
                            .background(
                                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                                RoundedCornerShape(4.dp)
                            )
                            .padding(vertical = 2.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = p,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.primary
                        )
                        if (def != null) {
                            Text(
                                text = def.time,
                                fontSize = 9.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    if (idx < displayPeriods.size - 1) {
                        Spacer(modifier = Modifier.height(gap))
                    }
                }
            }

            Spacer(modifier = Modifier.width(gap))

            // 每日課程欄位 (週一至週五)
            schoolDays.forEach { day ->
                val isToday = (day == currentWeekday)
                val dayCourses = weekSchedule[day] ?: emptyList()

                Column(modifier = Modifier.width(dayColWidth)) {
                    var i = 0
                    while (i < displayPeriods.size) {
                        val p = displayPeriods[i]
                        val scheduled = dayCourses.find { it.firstPeriod == p }

                        if (scheduled != null) {
                            val covered = displayPeriods.filter { dp ->
                                val dpIdx = NTUPeriods.ORDER.indexOf(dp)
                                dpIdx >= NTUPeriods.ORDER.indexOf(scheduled.firstPeriod) &&
                                        dpIdx <= NTUPeriods.ORDER.indexOf(scheduled.lastPeriod)
                            }
                            val span = maxOf(1, covered.size)
                            val cardHeight = (rowHeight.value * span + gap.value * (span - 1)).dp
                            val theme = WidgetColors.getCourseTheme(scheduled.course.name)

                            Surface(
                                modifier = Modifier
                                    .width(dayColWidth)
                                    .height(cardHeight)
                                    .clickable { onCourseClick(scheduled.course) },
                                shape = RoundedCornerShape(6.dp),
                                color = theme.bg.copy(alpha = 0.85f),
                                border = BorderStroke(1.dp, theme.border)
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .padding(horizontal = 3.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = scheduled.course.name,
                                        color = theme.text,
                                        fontSize = if (span >= 2) 11.sp else 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        maxLines = if (span >= 3) 3 else (if (span >= 2) 2 else 1),
                                        overflow = TextOverflow.Ellipsis,
                                        lineHeight = 13.sp
                                    )
                                    if (scheduled.location.isNotBlank() && span >= 2) {
                                        Spacer(modifier = Modifier.height(1.dp))
                                        Text(
                                            text = "📍${scheduled.location}",
                                            color = theme.sub,
                                            fontSize = 9.sp,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }
                            }
                            i += span
                        } else {
                            // 空白時段格子
                            Box(
                                modifier = Modifier
                                    .width(dayColWidth)
                                    .height(rowHeight)
                                    .background(
                                        if (isToday) MaterialTheme.colorScheme.primary.copy(alpha = 0.06f)
                                        else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.15f),
                                        RoundedCornerShape(4.dp)
                                    )
                            )
                            i += 1
                        }

                        if (i < displayPeriods.size) {
                            Spacer(modifier = Modifier.height(gap))
                        }
                    }
                }

                Spacer(modifier = Modifier.width(gap))
            }
        }
    }
}
