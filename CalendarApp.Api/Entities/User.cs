namespace CalendarApp.Api.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;

        //Связь: один пользователь может иметь много задач
        public List<TaskItem> Tasks { get; set; } = new ();
    }
}