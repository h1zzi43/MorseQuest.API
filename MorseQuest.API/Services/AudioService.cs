namespace MorseQuest.API.Services;

public class AudioService
{
    public byte[] GenerateMorseAudio(string morseCode)
    {
        const int sampleRate = 8000;
        const int dotDuration = 100;
        const int dashDuration = 300;
        const int symbolPause = 100;
        const int letterPause = 300;
        const int frequency = 800;
        const double amplitude = 0.5;

        var samples = new List<short>();

        foreach (char c in morseCode)
        {
            switch (c)
            {
                case '.':
                    AddTone(samples, dotDuration, frequency, amplitude, sampleRate);
                    AddSilence(samples, symbolPause, sampleRate);
                    break;
                case '-':
                    AddTone(samples, dashDuration, frequency, amplitude, sampleRate);
                    AddSilence(samples, symbolPause, sampleRate);
                    break;
                case ' ':
                    AddSilence(samples, letterPause, sampleRate);
                    break;
            }
        }

        return CreateWavFile(samples, sampleRate);
    }

    private void AddTone(List<short> samples, int durationMs, int frequency,
                         double amplitude, int sampleRate)
    {
        int numSamples = sampleRate * durationMs / 1000;
        for (int i = 0; i < numSamples; i++)
        {
            double t = (double)i / sampleRate;
            short sample = (short)(amplitude * short.MaxValue *
                          Math.Sin(2 * Math.PI * frequency * t));
            samples.Add(sample);
        }
    }

    private void AddSilence(List<short> samples, int durationMs, int sampleRate)
    {
        int numSamples = sampleRate * durationMs / 1000;
        samples.AddRange(new short[numSamples]);
    }

    private byte[] CreateWavFile(List<short> samples, int sampleRate)
    {
        using var ms = new MemoryStream();
        using var writer = new BinaryWriter(ms);

        int dataSize = samples.Count * 2;
        int fileSize = 44 + dataSize;

        writer.Write(new char[] { 'R', 'I', 'F', 'F' });
        writer.Write(fileSize - 8);
        writer.Write(new char[] { 'W', 'A', 'V', 'E' });
        writer.Write(new char[] { 'f', 'm', 't', ' ' });
        writer.Write(16);
        writer.Write((short)1);
        writer.Write((short)1);
        writer.Write(sampleRate);
        writer.Write(sampleRate * 2);
        writer.Write((short)2);
        writer.Write((short)16);
        writer.Write(new char[] { 'd', 'a', 't', 'a' });
        writer.Write(dataSize);

        foreach (var sample in samples)
        {
            writer.Write(sample);
        }

        return ms.ToArray();
    }
}