package tw.edu.ntu.coursecalendar.widget

import android.content.Context
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
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import tw.edu.ntu.coursecalendar.MainActivity
import tw.edu.ntu.coursecalendar.data.CourseParser
import tw.edu.ntu.coursecalendar.data.CourseRepository
import tw.edu.ntu.coursecalendar.data.ScheduledCourse
import java.util.*

class TodayGlanceWidget : GlanceAppWidget() {

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val repo = CourseRepository(context)
        val courses = repo.getCourses()
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
        val month = calendar.get(Calendar.MONTH) + 1
        val dayOfMonth = calendar.get(Calendar.DAY_OF_MONTH)
        val currentMinutes = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)

        val todayCourses = weekSchedule[currentWeekday] ?: emptyList()

        provideContent {
            Column(
                modifier = GlanceModifier
                    .fillMaxSize()
                    .background(WidgetColors.BgStart)
                    .cornerRadius(16.dp)
                    .padding(10.dp)
                    .clickable(actionStartActivity<MainActivity>())
            ) {
                // 頂部標題列
                Row(
                    modifier = GlanceModifier.fillMaxWidth().padding(bottom = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "📅 週$currentWeekday 今日節次功課表",
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
                                text = "☕ 今日無排課",
                                style = TextStyle(
                                    color = ColorProvider(WidgetColors.AccentGlow),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            )
                            Spacer(modifier = GlanceModifier.height(4.dp))
                            Text(
                                text = "點擊開啟 2D 週功課表",
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
                            val isNow = currentMinutes in c.startMin..c.endMin
                            val theme = WidgetColors.getCourseTheme(c.course.name)
                            val periodsText = if (c.firstPeriod == c.lastPeriod) "第 ${c.firstPeriod} 節" else "第 ${c.firstPeriod}-${c.lastPeriod} 節"

                            Row(
                                modifier = GlanceModifier
                                    .fillMaxWidth()
                                    .padding(vertical = 2.dp)
                                    .background(ColorProvider(if (isNow) WidgetColors.CardHighlight else WidgetColors.CardBg))
                                    .cornerRadius(8.dp)
                                    .padding(horizontal = 8.dp, vertical = 5.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // 左側節次與時間標籤
                                Column(
                                    modifier = GlanceModifier.width(64.dp),
                                    horizontalAlignment = Alignment.Start
                                ) {
                                    Text(
                                        text = periodsText,
                                        style = TextStyle(
                                            color = ColorProvider(if (isNow) WidgetColors.Warning else WidgetColors.AccentGlow),
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

                                // 右側課程彩色區塊
                                Column(
                                    modifier = GlanceModifier.defaultWeight()
                                ) {
                                    Row(
                                        modifier = GlanceModifier.fillMaxWidth(),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = c.course.name,
                                            style = TextStyle(
                                                color = ColorProvider(theme.text),
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold
                                            ),
                                            maxLines = 1
                                        )
                                        if (isNow) {
                                            Spacer(modifier = GlanceModifier.width(4.dp))
                                            Text(
                                                text = "●進行中",
                                                style = TextStyle(
                                                    color = ColorProvider(WidgetColors.Warning),
                                                    fontSize = 9.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                            )
                                        }
                                    }

                                    if (c.location.isNotBlank()) {
                                        Text(
                                            text = "📍 ${c.location} ${if (!c.course.instructor.isNullOrBlank()) "· ${c.course.instructor}" else ""}",
                                            style = TextStyle(
                                                color = ColorProvider(theme.sub),
                                                fontSize = 9.sp
                                            ),
                                            maxLines = 1
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
