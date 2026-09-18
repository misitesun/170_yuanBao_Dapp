# Toast
Use `const { message, showToast } = useToast()` and render `<Toast message={message} />`. A portal presents a non-blocking status message for 2.5 seconds. New messages replace the current one and restart its timeout; unmount cancels the timer.
轻提示通过 portal 展示，不拦截点击；重复调用重新计时，卸载时清理，不承载接口或交易逻辑。
