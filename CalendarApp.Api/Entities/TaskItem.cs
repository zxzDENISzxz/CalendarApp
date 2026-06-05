namespace CalendarApp.Api.Entities
{
    public class TaskItem
    {
        public int Id { get; set; }
        public string Title { get; set; } = null!;
        public string? Description { get; set; }

        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }

        // Ссылка на группу
        public int? GroupId { get; set; }
        public Group? Group { get; set; }

        // Флаг для внешних расписаний
        public bool IsExternal { get; set; } = false;

        // Список исполнителей (связь многие-ко-многим)
        public List<User> Users { get; set; } = new ();
    }
}