package tw.edu.ntu.coursecalendar.widget

import android.content.Context
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalSize
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.ContentScale
import androidx.glance.layout.fillMaxSize
import tw.edu.ntu.coursecalendar.MainActivity
import tw.edu.ntu.coursecalendar.data.CourseParser
import tw.edu.ntu.coursecalendar.data.CourseRepository

class TimetableGlanceWidget : GlanceAppWidget() {

    override val sizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val repo = CourseRepository(context)
        val courses = repo.getCourses()
        val weekSchedule = CourseParser.buildWeekSchedule(courses)

        provideContent {
            val size = LocalSize.current
            val density = context.resources.displayMetrics.density
            val screenWidthDp = context.resources.configuration.screenWidthDp
            val screenHeightDp = context.resources.configuration.screenHeightDp

            // 尺寸自適應演算法：精準偵測手機螢幕寬度與微件邊界
            val widgetWidthDp = when {
                size.width > 60.dp -> size.width
                screenWidthDp > 60 -> (screenWidthDp - 28).dp
                else -> 360.dp
            }
            val widgetHeightDp = when {
                size.height > 60.dp -> size.height
                else -> 260.dp
            }

            val bitmap = TimetableBitmapRenderer.render(
                context = context,
                courses = courses,
                weekSchedule = weekSchedule,
                widthDp = widgetWidthDp.value,
                heightDp = widgetHeightDp.value
            )

            Box(
                modifier = GlanceModifier
                    .fillMaxSize()
                    .cornerRadius(16.dp)
                    .clickable(actionStartActivity<MainActivity>()),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    provider = ImageProvider(bitmap),
                    contentDescription = "臺大週課表",
                    contentScale = ContentScale.FillBounds,
                    modifier = GlanceModifier.fillMaxSize()
                )
            }
        }
    }
}
