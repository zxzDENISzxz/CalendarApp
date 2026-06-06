using System.Text.Json.Serialization;

namespace CalendarApp.Api.Entities;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;

    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;

    //Связь: один пользователь может иметь много задач
    [JsonIgnore]
    public List<TaskItem> Tasks { get; set; } = new ();
}