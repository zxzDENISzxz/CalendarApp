namespace CalendarApp.Api.Entities
{
    public class Group
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string ColorHex { get; set; } = "#3788d8"; // Цвет для фронтенда
    }
}