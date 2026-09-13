package tw.edu.ntu.coursecalendar.widget

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.*
import androidx.glance.appwidget.SizeMode
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import tw.edu.ntu.coursecalendar.MainActivity
import tw.edu.ntu.coursecalendar.data.CampusBuildings
import tw.edu.ntu.coursecalendar.data.CourseParser
import tw.edu.ntu.coursecalendar.data.CourseRepository
import tw.edu.ntu.coursecalendar.data.ScheduledCourse
import java.util.*

class TodayGlanceWidget : GlanceAppWidget() {

    override val sizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val repo = CourseRepository(context)
        val courses = repo.getCourses()
        val isEnglish = repo.isEnglish()
        val weekSchedule = CourseParser.buildWeekSchedule(courses)

        val calendar = Calendar.getInstance()
        val dayOfWeekInt = calendar.get(Calendar.DAY_OF_WEEK)
        val currentWeekday = when (dayOfWeekInt) {
            Calendar.MONDAY -> "一"
            Calendar.TUESDAY -> "二"
            Calendar.WEDNESDAY -> "三"
            Calendar.THURSDAY -> "四"
            Calendar.FRIDAY -> "五"
            Calendar.SATURDAY -> "六"
            else -> "日"
        }
        val currentWeekdayEn = when (dayOfWeekInt) {
            Calendar.MONDAY -> "Mon"
            Calendar.TUESDAY -> "Tue"
            Calendar.WEDNESDAY -> "Wed"
            Calendar.THURSDAY -> "Thu"
            Calendar.FRIDAY -> "Fri"
            Calendar.SATURDAY -> "Sat"
            else -> "Sun"
        }
        val month = calendar.get(Calendar.MONTH) + 1
        val dayOfMonth = calendar.get(Calendar.DAY_OF_MONTH)
        val currentMinutes = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)

        val todayCourses = weekSchedule[currentWeekday] ?: emptyList()

        // 判斷當前進行中與下一堂課
        val activeCourse = todayCourses.find { currentMinutes in it.startMin..it.endMin }
        val nextCourse = if (activeCourse == null) todayCourses.find { it.startMin > currentMinutes } else null

        provideContent {
            Column(
                modifier = GlanceModifier
                    .fillMaxSize()
                    .background(WidgetColors.BgStart)
                    .cornerRadius(16.dp)
                    .padding(10.dp)
                    .clickable(actionStartActivity(Intent(context, MainActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    }))
            ) {
                // 頂部標題列
                Row(
                    modifier = GlanceModifier.fillMaxWidth().padding(bottom = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (isEnglish) "📅 $currentWeekdayEn Today's Schedule" else "📅 週$currentWeekday 今日節次功課表",
                        style = TextStyle(
                            color = ColorProvider(WidgetColors.Accent),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Spacer(modifier = GlanceModifier.defaultWeight())
                    Text(
                        text = "$month/$dayOfMonth",
                        style = TextStyle(
                            color = ColorProvider(WidgetColors.SecondaryText),
                            fontSize = 11.sp
                        )
                    )
                }

                if (todayCourses.isEmpty()) {
                    Box(
                        modifier = GlanceModifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = if (isEnglish) "☕ No Classes Today" else "☕ 今日無排課",
                                style = TextStyle(
                                    color = ColorProvider(WidgetColors.AccentGlow),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            )
                            Spacer(modifier = GlanceModifier.height(4.dp))
                            Text(
                                text = if (isEnglish) "Tap to open full timetable" else "點擊開啟 2D 週功課表",
                                style = TextStyle(
                                    color = ColorProvider(WidgetColors.SecondaryText),
                                    fontSize = 11.sp
                                )
                            )
                        }
                    }
                } else {
                    // 今日節次功課表排程
                    Column(
                        modifier = GlanceModifier.fillMaxSize()
                    ) {
                        todayCourses.take(4).forEachIndexed { idx, c ->
                            val isNow = (c == activeCourse)
                            val isNext = (c == nextCourse)
                            val displayName = c.course.getDisplayName(isEnglish)
                            val theme = WidgetColors.getCourseTheme(c.course.name)
                            val periodsText = if (isEnglish) {
                                if (c.firstPeriod == c.lastPeriod) "Period ${c.firstPeriod}" else "P ${c.firstPeriod}-${c.lastPeriod}"
                            } else {
                                if (c.firstPeriod == c.lastPeriod) "第 ${c.firstPeriod} 節" else "第 ${c.firstPeriod}-${c.lastPeriod} 節"
                            }

                            val resolvedLocation = CampusBuildings.resolveLocation(c.location)

                            // 點擊課堂開啟 App 詳情
                            val openCourseDetailIntent = Intent(context, MainActivity::class.java).apply {
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                                putExtra(MainActivity.EXTRA_HIGHLIGHT_COURSE, c.course.name)
                            }

                            Row(
                                modifier = GlanceModifier
                                    .fillMaxWidth()
                                    .padding(vertical = 2.dp)
                                    .background(ColorProvider(if (isNow) WidgetColors.CardHighlight else (if (isNext) WidgetColors.HeaderBg else WidgetColors.CardBg)))
                                    .cornerRadius(8.dp)
                                    .padding(horizontal = 8.dp, vertical = 5.dp)
                                    .clickable(actionStartActivity(openCourseDetailIntent)),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // 左側節次與時間標籤
                                Column(
                                    modifier = GlanceModifier.width(62.dp),
                                    horizontalAlignment = Alignment.Start
                                ) {
                                    Text(
                                        text = periodsText,
                                        style = TextStyle(
                                            color = ColorProvider(if (isNow) WidgetColors.Warning else (if (isNext) WidgetColors.Accent else WidgetColors.AccentGlow)),
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    )
                                    Text(
                                        text = "${c.startTimeText}-${c.endTimeText}",
                                        style = TextStyle(
                                            color = ColorProvider(WidgetColors.SecondaryText),
                                            fontSize = 8.sp
                                        )
                                    )
                                }

                                Spacer(modifier = GlanceModifier.width(6.dp))

                                // 中間課程資訊
                                Column(
                                    modifier = GlanceModifier.defaultWeight()
                                ) {
                                    Row(
                                        modifier = GlanceModifier.fillMaxWidth(),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = displayName,
                                            style = TextStyle(
                                                color = ColorProvider(theme.text),
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold
                                            ),
                                            maxLines = 1
                                        )
                                        if (isNow) {
                                            Spacer(modifier = GlanceModifier.width(4.dp))
                                            val remainMin = maxOf(0, c.endMin - currentMinutes)
                                            Text(
                                                text = if (isEnglish) "●Active(${remainMin}m)" else "●進行中(剩${remainMin}分)",
                                                style = TextStyle(
                                                    color = ColorProvider(WidgetColors.Warning),
                                                    fontSize = 8.5.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                            )
                                        } else if (isNext) {
                                            Spacer(modifier = GlanceModifier.width(4.dp))
                                            val waitMin = maxOf(0, c.startMin - currentMinutes)
                                            Text(
                                                text = if (isEnglish) "●Next(${waitMin}m)" else "●下一堂(${waitMin}分後)",
                                                style = TextStyle(
                                                    color = ColorProvider(WidgetColors.Accent),
                                                    fontSize = 8.5.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                            )
                                        }
                                    }

                                    if (c.location.isNotBlank()) {
                                        val instructor = if (isEnglish && !c.course.instructorEn.isNullOrBlank()) c.course.instructorEn else c.course.instructor
                                        val teacher = if (instructor.isNullOrBlank()) "" else " · $instructor"
                                        Text(
                                            text = "📍 " + c.location + teacher,
                                            style = TextStyle(
                                                color = ColorProvider(theme.sub),
                                                fontSize = 9.sp
                                            ),
                                            maxLines = 1
                                        )
                                    }
                                }

                                // 右側：小工具專屬「📍 導航」按鈕
                                if (resolvedLocation != null) {
                                    Spacer(modifier = GlanceModifier.width(4.dp))
                                    val navUrl = "https://www.google.com/maps/dir/?api=1&destination=${resolvedLocation.building.lat},${resolvedLocation.building.lng}&travelmode=walking"
                                    val navIntent = Intent(Intent.ACTION_VIEW, Uri.parse(navUrl)).apply {
                                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                    }
                                    Box(
                                        modifier = GlanceModifier
                                            .background(ColorProvider(WidgetColors.Accent.copy(alpha = 0.25f)))
                                            .cornerRadius(6.dp)
                                            .padding(horizontal = 6.dp, vertical = 4.dp)
                                            .clickable(actionStartActivity(navIntent)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = if (isEnglish) "📍Nav" else "📍導航",
                                            style = TextStyle(
                                                color = ColorProvider(WidgetColors.Accent),
                                                fontSize = 9.5.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
