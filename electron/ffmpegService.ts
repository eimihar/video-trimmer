import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { app } from 'electron'
import { join } from 'path'

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged

const ffmpegPath = isDev 
  ? ffmpegInstaller.path 
  : join(process.resourcesPath, 'ffmpeg', 'ffmpeg.exe')

ffmpeg.setFfmpegPath(ffmpegPath)

export function trimVideo(
  inputPath: string,
  outputPath: string,
  startTime: number,
  endTime: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const duration = endTime - startTime
    
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .output(outputPath)
      .on('end', () => {
        resolve()
      })
      .on('error', (err) => {
        reject(err)
      })
      .run()
  })
}