using System;
using System.IO;
using System.Timers;
using Android.App;
using Android.Media;
using System.Collections.Generic;
using System.Threading.Tasks;
using Android.Content;
using Android.OS;
using Android.Widget;
using Android.Content.PM;
using Java.Interop;
using Android.Webkit;

namespace Hoho.Android.UsbSerial.Examples
{
    [Activity(Label = "Demo LPC845", Theme = "@android:style/Theme.NoTitleBar", LaunchMode = LaunchMode.SingleInstance)]

    class UsbWebView : Activity
    {
        WebView Wview;

        protected override void OnCreate(Bundle bundle)
        {
            base.OnCreate(bundle);
            SetContentView(Resource.Layout.UsbWebView);
            Wview = FindViewById<WebView>(Resource.Id.webView1);
            Wview.Settings.AllowFileAccessFromFileURLs = true;
            Wview.Settings.AllowFileAccess = true;
            Wview.Settings.JavaScriptEnabled = true;
            Wview.Settings.AllowContentAccess = true;
            Wview.Settings.LoadsImagesAutomatically = true;
            Wview.Settings.MediaPlaybackRequiresUserGesture = false;
            Wview.SetWebChromeClient(new WebChromeClient());
            var Device = new DeviceFunctions(this, Wview);
            Wview.AddJavascriptInterface(Device, "Device");
            Wview.LoadUrl("file:///android_asset/Page/index.html");
        }

        protected override void OnResume()
        {
            //Log.Debug("OnResume", "OnResume called, app is ready to interact with the user");
            base.OnResume();
        }
        protected override void OnPause()
        {
            base.OnPause();
            //Log.Debug("OnDestroy", "OnDestroy called, App is Terminating");
            Finish();
        }
    }
    public class DeviceFunctions : Java.Lang.Object
    {
        private Context Dcontext;
        private WebView Dview;
        public DeviceFunctions(Context context, WebView view)
        {
            Dcontext = context;
            Dview = view;
        }
        [Export]
        [JavascriptInterface]
        public void CheckData()
        {
            //Toast.MakeText(Dcontext, "CheckData", ToastLength.Short).Show();
            if (Init.UsbData != "")
            {
                string dataReceived = Init.UsbData;
                Init.UsbData = "";
                Validate(dataReceived);
            }
        }
        [Export]
        [JavascriptInterface]
        public void CallCSharp(string message)
        {
            //Toast.MakeText(Dcontext, $"Mensaje recibido desde JS: " + message, ToastLength.Long).Show();
            Init.UsbDataWrite(message); // envia los datos por USB
        }
        [Export]
        [JavascriptInterface]
        public void Validate(string sendData)  // 
        {
            Dview.Post(async () =>
            {
                JavascriptResult jr = new JavascriptResult();
                string obj = $"messageFromCsharp({sendData})";  // convierte el json en object de JS
                Dview.EvaluateJavascript(obj, jr);
                var result = await jr.JsResult;
            });
        }
    }
    public class JavascriptResult : Java.Lang.Object, IValueCallback
    {
        private TaskCompletionSource<string> source;

        public Task<string> JsResult => source.Task;

        public JavascriptResult()
        {
            source = new TaskCompletionSource<string>();
        }

        public void OnReceiveValue(Java.Lang.Object result)
        {
            try
            {
                string res = ((Java.Lang.String)result).ToString();

                source.SetResult(res);
            }
            catch (Exception ex)
            {
                source.SetException(ex);
            }
        }
    }
}


