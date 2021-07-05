using System;
using System.Collections.Generic;
using Android.Media;
using Android.App;
using Android.Content;
using Android.OS;
using Android.Views;
using Android.Widget;
using System.Threading.Tasks;
using Android.Hardware.Usb;
using Hoho.Android.UsbSerial.Driver;
using Hoho.Android.UsbSerial.Util;
using Android.Content.PM;
using System.Timers;

[assembly: UsesFeature("android.hardware.usb.host")]

namespace Hoho.Android.UsbSerial.Examples
{
    [Activity(Label = "Demo LCP845", MainLauncher = true, Theme = "@android:style/Theme.NoTitleBar", LaunchMode = LaunchMode.SingleInstance)]
    [IntentFilter(new[] { Intent.ActionMain })]
    [IntentFilter(new[] { UsbManager.ActionUsbDeviceAttached })]
    [MetaData(UsbManager.ActionUsbDeviceAttached, Resource = "@xml/device_filter")]

    public class Init : Activity
    {
        static readonly string TAG = typeof(Init).Name;
        const string ACTION_USB_PERMISSION = "com.hoho.android.usbserial.examples.USB_PERMISSION";
        public const string EXTRA_TAG = "PortInfo";

        volatile static UsbManager usbManager;
        internal static SerialInputOutputManager serialIoManager;
        volatile static UsbSerialPortAdapter adapter;
        volatile static BroadcastReceiver detachedReceiver;
        volatile static IUsbSerialPort selectedPort;

        internal static string UsbData = "";
        internal static bool usbConnect = false;
        Button ButtonExit, ButtonConnect;
        TextView tv_rxd;
        EditText tv_txd;
        int baudRate = 38400;
        Timer TimerX = new Timer();
        internal static void Hide_All(Window window)
        {
            var uiOptions = SystemUiFlags.HideNavigation | SystemUiFlags.LayoutHideNavigation |
                            SystemUiFlags.LayoutFullscreen | SystemUiFlags.Fullscreen |
                            SystemUiFlags.LayoutStable | SystemUiFlags.ImmersiveSticky;

            window.DecorView.SystemUiVisibility = (StatusBarVisibility)uiOptions;
            window.AddFlags(WindowManagerFlags.KeepScreenOn);
            window.SetFlags(WindowManagerFlags.KeepScreenOn, WindowManagerFlags.KeepScreenOn);
        }

        internal static void Sound(Context context)
        {
            MediaPlayer player = MediaPlayer.Create(context, Resource.Raw.beep);
            player.Start();

            player.Completion += delegate
            {
                player.Release();
                player = null;
            };
        }

        internal static void UsbDataWrite(string udata) {
            serialIoManager.Write(udata,100);
        }
        protected override void OnCreate(Bundle savedInstanceState)
        {
            base.OnCreate(savedInstanceState);
            SetContentView(Resource.Layout.UsbHost);
        }

        protected override void OnStart()
        {
            //Log.Debug("OnStart", "OnStart called, App is Active");
            base.OnStart();
        }
        protected override void OnResume()
        {
            //Log.Debug("OnResume", "OnResume called, app is ready to interact with the user");
            base.OnResume();
            usbConnect = false;
            InitUsbSerial(baudRate);
            Hide_All(this.Window);
            
            TimerX.Interval = 1000;
            TimerX.Enabled = true;
            TimerX.Start();
            TimerX.Elapsed += delegate
            {
                RunOnUiThread(() =>
                {
                    if (usbConnect == true)
                    {
                        StartActivity(typeof(UsbWebView));
                        OverridePendingTransition(Resource.Animation.fade_in, Resource.Animation.fade_out);
                        TimerX.Stop();
                    }
                    else {
                        InitUsbSerial(baudRate);
                        Toast.MakeText(this, "Buscando....", ToastLength.Short).Show();
                    }
                });
            };
        }
        protected override void OnPause()
        {
            //Log.Debug("OnPause", "OnPause called, App is moving to background");
            base.OnPause();
        }
        protected override void OnStop()
        {
            //Log.Debug("OnStop", "OnStop called, App is in the background");
            base.OnStop();

        }
        protected override void OnDestroy()
        {
            base.OnDestroy();
            //Log.Debug("OnDestroy", "OnDestroy called, App is Terminating");
            TimerX.Stop();
            Finish();
        }

        void UpdateReceivedData(byte[] data)
        {
            UsbData += System.Text.Encoding.ASCII.GetString(data);
        }

        async internal void InitUsbSerial(int baud_rate)
        {
            usbManager = null;
            serialIoManager = null;
            adapter = null;
            detachedReceiver = null;
            selectedPort = null;
                try
                {
                    usbManager = GetSystemService(Context.UsbService) as UsbManager;
                    adapter = new UsbSerialPortAdapter(this);
                    await PopulateListAsync();
                    //register the broadcast receivers
                    detachedReceiver = new UsbDeviceDetachedReceiver(this);
                    RegisterReceiver(detachedReceiver, new IntentFilter(UsbManager.ActionUsbDeviceDetached));
                    selectedPort = adapter.GetItem(0);
                    var permissionGranted = await usbManager.RequestPermissionAsync(selectedPort.Driver.Device, this);
                    if (adapter.Count > 0 && permissionGranted)
                    {
                        var port = adapter.GetItem(0);
                        var driver = port.Driver;
                        var device = driver.Device;
                        var title = string.Format("Vendor {0} Product {1}", HexDump.ToHexString((short)device.VendorId), HexDump.ToHexString((short)device.ProductId));
                        var subtitle = device.Class.SimpleName;

                        serialIoManager = new SerialInputOutputManager(port)
                        {
                            BaudRate = baud_rate,
                            DataBits = 8,
                            StopBits = StopBits.One,
                            Parity = Parity.None,
                        };
                        try
                        {
                            serialIoManager.Open(usbManager);
                            usbConnect = true;
                            serialIoManager.DataReceived += (sender, e) =>
                            {
                                RunOnUiThread(() =>
                                {
                                    UpdateReceivedData(e.Data);
                                });
                            };
                        }
                        catch (Java.IO.IOException e)
                        {
                            usbConnect = false;
							//Toast.MakeText(this, "Error1 al abrir puerto USB", ToastLength.Short).Show();
                            //Finish(); StartActivity(typeof(Init));
                        }
                    }
                }
                catch (Exception ex)
                {
                    usbConnect = false;
					//Toast.MakeText(this, "Error2 al abrir puerto USB", ToastLength.Short).Show();
                    //Finish(); StartActivity(typeof(Init));
                }
        }

        internal static Task<IList<IUsbSerialDriver>> FindAllDriversAsync(UsbManager usbManager)
        {
            // using the default probe table
            //return UsbSerialProber.DefaultProber.FindAllDriversAsync (usbManager);

            // adding a custom driver to the default probe table
            var table = UsbSerialProber.DefaultProbeTable;
            table.AddProduct(0x1b4f, 0x0008, Java.Lang.Class.FromType(typeof(CdcAcmSerialDriver))); // IOIO OTG
            var prober = new UsbSerialProber(table);
            return prober.FindAllDriversAsync(usbManager);
        }

        async Task PopulateListAsync()
        {

            var drivers = await FindAllDriversAsync(usbManager);

            adapter.Clear();
            foreach (var driver in drivers)
            {
                var ports = driver.Ports;
                foreach (var port in ports)
                    adapter.Add(port);
            }

            adapter.NotifyDataSetChanged();
        }

        #region UsbSerialPortAdapter implementation

        class UsbSerialPortAdapter : ArrayAdapter<IUsbSerialPort>
        {
            public UsbSerialPortAdapter(Context context)
                : base(context, global::Android.Resource.Layout.SimpleExpandableListItem2)
            {
            }

            public override View GetView(int position, View convertView, ViewGroup parent)
            {
                var row = convertView;
                if (row == null)
                {
                    var inflater = Context.GetSystemService(Context.LayoutInflaterService) as LayoutInflater;
                    row = inflater.Inflate(global::Android.Resource.Layout.SimpleListItem2, null);
                }

                return row;
            }
        }

        #endregion

        #region UsbDeviceDetachedReceiver implementation

        class UsbDeviceDetachedReceiver
            : BroadcastReceiver
        {
            readonly string TAG = typeof(UsbDeviceDetachedReceiver).Name;
            readonly Init activity;

            public UsbDeviceDetachedReceiver(Init activity)
            {
                this.activity = activity;
            }

            public override void OnReceive(Context context, Intent intent)
            {
                var device = intent.GetParcelableExtra(UsbManager.ExtraDevice) as UsbDevice;

                //Log.Info (TAG, "USB device detached: " + device.DeviceName);

                activity.PopulateListAsync();
            }
        }

        #endregion

    }
}