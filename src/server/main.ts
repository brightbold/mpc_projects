import bodyParser from 'body-parser'
import express from 'express'
import cron from 'node-cron'
import ViteExpress from 'vite-express'
import config from './config.ts'
import { formatCookie, login, updateEnv } from './cron.ts'

const app = express()

app.use(bodyParser.json());

app.post('/set_cookie', async (req, res) => {
  const { code, cookie } = req.body
  const task = cron.getTasks().get('refreshProjects')
  if (!task || !code || code != process.env.REFRESH_PROJECTS_CODE) {
    res.json({
      success: false,
      error: 'invalid_code',
    })
    return
  }

  updateEnv({
    REFRESH_PROJECTS_CODE: undefined,
    REFRESH_PROJECTS_COOKIE: cookie,
  })

  if (await login(config.refreshProjects!.baseUrl, formatCookie(cookie))) {
    task.now()
    res.json({
      success: true,
    })
    return
  } else {
    res.json({
      success: false,
      error: 'invalid_cookie',
    })
    return
  }
})

ViteExpress.config({
  inlineViteConfig: {
    build: {
      outDir: './dist/client'
    }
  },
})
ViteExpress.listen(app, config.port, () =>
  console.log(`Server is listening on port ${config.port}...`)
)
